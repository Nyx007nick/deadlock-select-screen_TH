import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

export function createElevenLabsClient() {
    if (!process.env.ELEVENLABS_API_KEY) {
        throw new Error("Set ELEVENLABS_API_KEY in the server process environment.")
    }

    return new ElevenLabsClient()
}
