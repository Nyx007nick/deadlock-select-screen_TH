import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { abilityNamesTH, characterNamesTH } from "../src/assets/characterTranslations.js"

const sourceBase = "https://raw.githubusercontent.com/deadlock-wiki/deadlock-data/master/data"
const repositoryApi = "https://api.github.com/repos/deadlock-wiki/deadlock-data/commits/master"
const localHeroesPath = resolve("src/assets/character_list.json")
const outputPath = resolve("src/assets/abilityDetails.json")
const loreOutputPath = resolve("src/assets/characterLoreThai.json")
const heroAliases = {
    Doorman: "The Doorman",
    "Mo Krill": "Mo & Krill",
}
const abilityAliases = {
    "Calico|Pounce": "Leaping Slash",
    "Seven|Chain Lightning": "Lightning Ball",
    "Vyper|Hook Blade": "Screwjab Dagger",
}

async function loadJson(url) {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Unable to retrieve ${url}: HTTP ${response.status}`)
    }
    return response.json()
}

function getProps(card) {
    return ["Info1", "Info2"].flatMap((infoKey) => {
        const info = card[infoKey]
        if (!info) return []
        return ["Main", "Alt"].flatMap((groupKey) => info[groupKey]?.Props ?? [])
    })
}

function getText(localization, key) {
    return key ? localization[key] ?? null : null
}

function normalizeLore(value) {
    return value
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}

function createAbility(hero, abilityName, heroData, abilityCards, abilityData, thai, english, lastUpdated) {
    const sourceHeroName = heroAliases[hero.name] ?? hero.name
    const heroEntry = Object.entries(heroData).find(([, entry]) => entry.Name === sourceHeroName)
    if (!heroEntry) {
        throw new Error(`No source hero mapping found for ${hero.name}`)
    }

    const [heroId, heroSource] = heroEntry
    const cardSet = abilityCards[heroId]
    const sourceAbilityName = abilityAliases[`${hero.name}|${abilityName}`] ?? abilityName
    const card = Object.values(cardSet ?? {}).find(
        (entry) => entry && typeof entry === "object" && entry.Name === sourceAbilityName,
    )
    if (!card) {
        throw new Error(`No source ability mapping found for ${hero.name}: ${abilityName}`)
    }

    const raw = abilityData[card.Key]
    if (!raw) {
        throw new Error(`No gameplay data found for ${hero.name}: ${abilityName} (${card.Key})`)
    }

    const descriptionKeys = [...new Set([
        card.DescKey,
        card.Info1?.DescKey,
        card.Info2?.DescKey,
    ].filter(Boolean))]
    let descriptionThai = descriptionKeys.map((key) => getText(thai, key)).filter(Boolean)
    const descriptionEnglish = descriptionKeys.map((key) => getText(english, key)).filter(Boolean)
    if (hero.name === "Warden" && abilityName === "Last Stand" && !descriptionThai.length) {
        descriptionThai = [
            "ชาร์จเป็นเวลา 2 วินาที จากนั้นปล่อยคลื่นเป็นจังหวะที่สร้างความเสียหายแก่ศัตรูและฟื้นฟูพลังชีวิตให้คุณตามความเสียหายที่ทำได้ ระหว่างชาร์จ Last Stand คุณจะได้รับการต้านทานกระสุนและพลังวิญญาณเพิ่มขึ้นอย่างมาก และไม่ติดสถานะหวาดกลัวขณะสกิลทำงาน",
        ]
    }
    if (hero.name === "Drifter" && abilityName === "Bloodscent") {
        descriptionThai = descriptionThai.map((text) => text.startsWith("When enemy heroes are")
            ? "เมื่อฮีโร่ศัตรูมีพลังชีวิตต่ำ คุณจะสร้างความเสียหายเพิ่มขึ้นแก่พวกเขา ศัตรูเหล่านี้จะทิ้งรอยเลือดที่คงอยู่ไว้ตามเส้นทางที่เคลื่อนที่"
            : text)
    }

    const stats = Object.values(card.Headers ?? {}).map((stat) => ({
        label: stat.Name,
        value: stat.Value,
        type: stat.Type ?? null,
        scale: stat.Scale ?? null,
    }))
    if (raw.AbilityCooldown !== null && raw.AbilityCooldown !== undefined
        && !stats.some((stat) => stat.type === "cooldown" || /cooldown/i.test(stat.label ?? ""))) {
        stats.push({ label: "Cooldown", value: raw.AbilityCooldown, type: "cooldown", scale: null })
    }
    if (raw.AbilityDuration !== null && raw.AbilityDuration !== undefined
        && !stats.some((stat) => stat.type === "duration" || /duration/i.test(stat.label ?? ""))) {
        stats.push({ label: "Duration", value: raw.AbilityDuration, type: "duration", scale: null })
    }

    const properties = getProps(card).map((property) => ({
        label: property.Name,
        title: property.Title ?? null,
        value: property.Value,
        type: property.Type ?? null,
        scale: property.Scale ?? null,
    }))

    const upgrades = (card.Upgrades ?? []).map((upgrade, index) => {
        const descriptionThai = getText(thai, upgrade.DescKey)
        const descriptionEnglish = getText(english, upgrade.DescKey)
        return {
            tier: index + 1,
            descriptionThai,
            descriptionEnglish,
            properties: Object.entries(upgrade)
                .filter(([key, value]) => key !== "DescKey" && value !== null)
                .map(([key, value]) => ({ key, value })),
        }
    })

    return {
        heroId,
        heroName: hero.name,
        heroNameThai: characterNamesTH[hero.name] ?? null,
        sourceHeroName,
        abilityId: raw.Key,
        abilityName,
        abilityNameThai: abilityNamesTH[abilityName] ?? null,
        sourceAbilityName,
        icon: `abilities/${hero.name}/${hero.abilities.indexOf(abilityName) + 1}.png`,
        lastUpdated,
        descriptionThai,
        descriptionEnglish,
        stats,
        properties,
        cooldown: raw.AbilityCooldown ?? null,
        duration: raw.AbilityDuration ?? null,
        upgrades,
        wikiUrl: `https://deadlock.wiki/${encodeURIComponent(sourceHeroName.replaceAll(" ", "_"))}#${encodeURIComponent(sourceAbilityName.replaceAll(" ", "_"))}`,
    }
}

const heroes = JSON.parse(await readFile(localHeroesPath, "utf8"))
const [abilityCards, abilityData, heroData, thai, english] = await Promise.all([
    loadJson(`${sourceBase}/json/ability-cards.json`),
    loadJson(`${sourceBase}/json/ability-data.json`),
    loadJson(`${sourceBase}/json/hero-data.json`),
    loadJson(`${sourceBase}/localizations/thai.json`),
    loadJson(`${sourceBase}/localizations/english.json`),
])

let sourceRevision = "unknown"
try {
    const response = await fetch(repositoryApi, { headers: { Accept: "application/vnd.github+json" } })
    if (response.ok) {
        sourceRevision = (await response.json()).sha
    }
} catch (error) {
    console.warn(`Could not read source revision: ${error.message}`)
}

const generatedAt = new Date().toISOString()
const data = {}
const characterLoreThai = {}
const missingThaiLore = []
for (const hero of heroes) {
    const sourceHeroName = heroAliases[hero.name] ?? hero.name
    const heroEntry = Object.entries(heroData).find(([, entry]) => entry.Name === sourceHeroName)
    if (!heroEntry) {
        throw new Error(`No source hero mapping found for ${hero.name}`)
    }
    const [heroId] = heroEntry
    const lore = thai[`${heroId}_lore`]
    if (typeof lore === "string" && /\p{Script=Thai}/u.test(lore)) {
        characterLoreThai[hero.name] = normalizeLore(lore)
    } else {
        missingThaiLore.push(hero.name)
    }

    for (const abilityName of hero.abilities) {
        data[`${hero.name}|${abilityName}`] = createAbility(
            hero,
            abilityName,
            heroData,
            abilityCards,
            abilityData,
            thai,
            english,
            generatedAt,
        )
    }
}

await mkdir(resolve("src/assets"), { recursive: true })
await writeFile(outputPath, `${JSON.stringify({
    source: "deadlock-wiki/deadlock-data",
    sourceRevision,
    generatedAt,
    abilities: data,
}, null, 2)}\n`)
await writeFile(loreOutputPath, `${JSON.stringify({
    source: "deadlock-wiki/deadlock-data",
    sourceRevision,
    generatedAt,
    characters: characterLoreThai,
    missingThaiLore,
}, null, 2)}\n`)

console.log(`Generated ${Object.keys(data).length} ability records from ${sourceRevision}`)
console.log(`Generated Thai backstories for ${Object.keys(characterLoreThai).length} heroes`)
if (missingThaiLore.length) {
    console.warn(`Thai backstories unavailable for: ${missingThaiLore.join(", ")}`)
}
