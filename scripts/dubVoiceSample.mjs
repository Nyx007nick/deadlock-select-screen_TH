import { mkdir, readFile, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const args = process.argv.slice(2)
const batchGroup = {
    "--one-selected-per-hero": "selected",
    "--one-unselected-per-covered-hero": "unselected",
}[args[0]]
const batchMode = Boolean(batchGroup)
const regenerate = args.includes("--regenerate")
const cloningStrengthIndex = args.indexOf("--cloning-strength")
const cloningStrength = cloningStrengthIndex >= 0 ? Number(args[cloningStrengthIndex + 1]) : undefined
const positionalArgs = args.filter((arg, index) => (
    arg !== "--regenerate" &&
    arg !== "--cloning-strength" &&
    (cloningStrengthIndex < 0 || index !== cloningStrengthIndex + 1)
))
const [heroName = "Abrams", voiceGroup = "selected", sourceFilename = "select_01.opus"] = batchMode
    ? []
    : positionalArgs
const outputFilename = `${sourceFilename.replace(/\.[^.]+$/, "")}.flac`
const apiBase = "https://api.elevenlabs.io/v1"
const manifestPath = resolve("src/assets/voiceThaiManifest.json")

if (!["selected", "unselected"].includes(voiceGroup)) {
    throw new Error("Voice group must be 'selected' or 'unselected'.")
}
if (cloningStrength !== undefined && (!Number.isInteger(cloningStrength) || cloningStrength < 0 || cloningStrength > 10)) {
    throw new Error("Cloning strength must be an integer from 0 to 10.")
}

const outputPath = resolve("public/vo_th", heroName, outputFilename)

function parseEnv(content) {
    return Object.fromEntries(content.split(/\r?\n/).flatMap((line) => {
        const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
        if (!match) return []
        const value = match[2].replace(/^(['"])(.*)\1$/, "$2")
        return [[match[1], value]]
    }))
}

async function loadLocalEnv() {
    try {
        return parseEnv(await readFile(resolve(".env.local"), "utf8"))
    } catch (error) {
        if (error.code === "ENOENT") return {}
        throw error
    }
}

async function loadAssetBase() {
    if (process.env.VITE_ASSETS_SOURCE) return process.env.VITE_ASSETS_SOURCE
    const env = parseEnv(await readFile(resolve(".env"), "utf8"))
    if (!env.VITE_ASSETS_SOURCE) throw new Error("VITE_ASSETS_SOURCE is not configured.")
    return env.VITE_ASSETS_SOURCE
}

async function requestJson(url, options) {
    const response = await fetch(url, options)
    if (!response.ok) {
        const body = await response.json()
        const details = Array.isArray(body.detail)
            ? body.detail.map(({ loc, msg, type }) => {
                const location = Array.isArray(loc) ? loc.join(".") : "request"
                return `${location}: ${msg} (${type})`
            })
            : [typeof body.detail === "string" ? body.detail : body.detail?.message ?? body.message]
        const message = details.filter(Boolean).join("; ").replace(/https?:\/\/\S+/g, "[URL]")
        throw new Error(`ElevenLabs request failed with HTTP ${response.status}${message ? `: ${message}` : "."}`)
    }
    return response.json()
}

function parseWebVtt(content) {
    return content.split(/\r?\n\r?\n/).flatMap((block) => {
        const lines = block.split(/\r?\n/)
        const timingIndex = lines.findIndex((line) => line.includes("-->"))
        if (timingIndex < 0) return []
        const [start, end] = lines[timingIndex].split("-->").map((time) => time.trim().split(/\s+/)[0])
        const text = lines.slice(timingIndex + 1).join(" ").replace(/<[^>]*>/g, "").trim()
        if (!text) return []
        return [{ start, end, text }]
    })
}

function describeProviderError(status) {
    const details = status.error ?? status
    return JSON.stringify(details).replace(/https?:\/\/\S+/g, "[URL]")
}

async function readExistingOutput(manifest) {
    try {
        await readFile(outputPath)
        const mappedPath = manifest.clips?.[heroName]?.[voiceGroup]?.[sourceFilename]
        if (mappedPath !== `vo_th/${heroName}/${outputFilename}`) {
            throw new Error(`Refusing to overwrite an unmapped audio file: ${outputPath}`)
        }
        if (regenerate) {
            console.log(`Regenerating the mapped Thai audio for ${heroName}/${sourceFilename}.`)
            return false
        }
        console.log(`Thai audio already exists for ${heroName}/${sourceFilename}; skipping paid generation.`)
        return true
    } catch (error) {
        if (error.code === "ENOENT") return false
        throw error
    }
}

async function dubOneClipPerHero(voices, targetGroup) {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
    const jobs = []

    for (const [hero, groups] of Object.entries(voices)) {
        const targetClips = groups[targetGroup] ?? []
        if (!targetClips.length) continue

        if (targetGroup === "unselected") {
            const selectedClips = groups.selected ?? []
            const selectedMappings = manifest.clips?.[hero]?.selected ?? {}
            const selectedClip = Object.entries(selectedMappings).find(([sourceClip]) => selectedClips.includes(sourceClip))
            if (!selectedClip) continue
            try {
                await readFile(resolve("public", selectedClip[1]))
            } catch (error) {
                if (error.code === "ENOENT") {
                    throw new Error(`Thai selected audio mapping exists but file is missing for ${hero}/${selectedClip[0]}.`)
                }
                throw error
            }
        }

        const existingMappings = manifest.clips?.[hero]?.[targetGroup] ?? {}
        const existingClip = Object.entries(existingMappings).find(([sourceClip]) => targetClips.includes(sourceClip))
        if (existingClip) {
            const [, mappedPath] = existingClip
            try {
                await readFile(resolve("public", mappedPath))
            } catch (error) {
                if (error.code === "ENOENT") {
                    throw new Error(`Thai audio mapping exists but file is missing for ${hero}/${existingClip[0]}.`)
                }
                throw error
            }
            console.log(`Skipping ${hero}; Thai ${targetGroup} audio already exists.`)
            continue
        }

        jobs.push([hero, targetGroup, targetClips[0]])
    }

    console.log(`Generating one ${targetGroup} Thai voice clip for ${jobs.length} characters.`)
    const scriptPath = fileURLToPath(import.meta.url)
    for (const job of jobs) {
        console.log(`\nStarting ${job[0]}/${job[2]}.`)
        await new Promise((resolveJob, rejectJob) => {
            const child = spawn(process.execPath, [scriptPath, ...job], { stdio: "inherit" })
            child.once("error", rejectJob)
            child.once("exit", (code) => {
                if (code === 0) resolveJob()
                else rejectJob(new Error(`Dubbing stopped after ${job[0]}/${job[2]} (exit code ${code}).`))
            })
        })
    }
    console.log(`\nFinished generating one ${targetGroup} Thai voice clip for ${jobs.length} characters.`)
}

async function main() {
    const localEnv = await loadLocalEnv()
    const apiKey = process.env.ELEVENLABS_API_KEY ?? localEnv.ELEVENLABS_API_KEY
    if (!apiKey) {
        throw new Error("Set ELEVENLABS_API_KEY in the process environment or ignored .env.local file.")
    }

    const voices = JSON.parse(await readFile(resolve("src/assets/vo_list.json"), "utf8"))
    if (batchMode) {
        await dubOneClipPerHero(voices, batchGroup)
        return
    }

    if (!voices[heroName]?.[voiceGroup]?.includes(sourceFilename)) {
        throw new Error(`The selected source clip is not mapped to ${heroName}/${voiceGroup}.`)
    }
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
    if (await readExistingOutput(manifest)) return

    const assetBase = await loadAssetBase()
    const sourceUrl = new URL(`vo/${heroName}/${sourceFilename}`, assetBase).toString()
    const headers = { "xi-api-key": apiKey }
    const form = new FormData()
    form.set("source_url", sourceUrl)
    form.set("source_language", "en")
    form.set("model_id", "dubbing_v2")
    form.set("name", `${heroName} ${sourceFilename} Thai sample`)
    if (cloningStrength === undefined) form.set("target_language", "th")

    const project = await requestJson(`${apiBase}/dubbing/project`, {
        method: "POST",
        headers,
        body: form,
    })
    const projectId = project.project_id
    if (!projectId) {
        throw new Error("ElevenLabs did not return a dubbing project ID.")
    }

    const deadline = Date.now() + 5 * 60 * 1000
    let projectStatus
    do {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 5000))
        projectStatus = await requestJson(`${apiBase}/dubbing/project/${encodeURIComponent(projectId)}`, { headers })
        if (projectStatus.status === "failed") {
            throw new Error(`ElevenLabs reported project preparation failure: ${describeProviderError(projectStatus)}`)
        }
    } while (projectStatus.status !== "ready" && Date.now() < deadline)
    if (projectStatus.status !== "ready") throw new Error("Timed out waiting for the dubbing project to become ready.")

    let languageId = project.language_ids?.[0]
    if (cloningStrength !== undefined) {
        const language = await requestJson(
            `${apiBase}/dubbing/project/${encodeURIComponent(projectId)}/language`,
            {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({
                    target_language: "th",
                    voice_settings: { cloning_strength: cloningStrength },
                }),
            },
        )
        languageId = language.language_id
    }
    if (!languageId) {
        throw new Error("ElevenLabs did not return a Thai language target ID.")
    }

    let languageStatus
    do {
        languageStatus = await requestJson(
            `${apiBase}/dubbing/project/${encodeURIComponent(projectId)}/language/${encodeURIComponent(languageId)}`,
            { headers },
        )
        if (languageStatus.status === "failed") {
            throw new Error(`ElevenLabs reported Thai dubbing failure: ${describeProviderError(languageStatus)}`)
        }
        if (languageStatus.status !== "completed") await new Promise((resolveDelay) => setTimeout(resolveDelay, 5000))
    } while (languageStatus.status !== "completed" && Date.now() < deadline)
    if (languageStatus.status !== "completed") throw new Error("Timed out waiting for the Thai sample dub.")

    const subtitlesUrl = languageStatus.outputs?.subtitles
    const audioUrl = languageStatus.outputs?.lossless_audio
    if (!subtitlesUrl || !audioUrl) {
        throw new Error("ElevenLabs completed the dub without providing its audio and subtitle outputs.")
    }
    const transcriptResponse = await fetch(subtitlesUrl)
    if (!transcriptResponse.ok) {
        throw new Error(`Unable to retrieve the translated transcript (HTTP ${transcriptResponse.status}).`)
    }
    const utterances = parseWebVtt(await transcriptResponse.text())
    const translatedText = utterances.map(({ text }) => text)
    if (!translatedText.length || !translatedText.some((text) => /\p{Script=Thai}/u.test(text))) {
        throw new Error("The dubbing service returned no Thai transcript; audio was not integrated.")
    }

    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
        throw new Error(`Unable to download the Thai dub (HTTP ${audioResponse.status}).`)
    }
    const audio = Buffer.from(await audioResponse.arrayBuffer())
    if (audio.subarray(0, 4).toString("ascii") !== "fLaC") {
        throw new Error("ElevenLabs returned an empty or unexpected audio response.")
    }

    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, audio)

    manifest.generatedAt = new Date().toISOString()
    manifest.clips[heroName] ??= {}
    manifest.clips[heroName][voiceGroup] ??= {}
    manifest.clips[heroName][voiceGroup][sourceFilename] = `vo_th/${heroName}/${outputFilename}`
    manifest.transcripts ??= {}
    manifest.transcripts[heroName] ??= {}
    manifest.transcripts[heroName][voiceGroup] ??= {}
    manifest.transcripts[heroName][voiceGroup][sourceFilename] = {
        projectId,
        languageId,
        generatedAt: manifest.generatedAt,
        thai: translatedText,
        cues: utterances,
    }
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

    console.log(`Saved Thai audio for ${heroName}/${sourceFilename} (${audio.length} bytes).`)
    console.log("Review its translated transcript and audio quality before generating more clips.")
}

main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
})
