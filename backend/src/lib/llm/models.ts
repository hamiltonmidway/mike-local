import type { Provider } from "./types";

// ---------------------------------------------------------------------------
// Canonical model IDs
// ---------------------------------------------------------------------------
// Main-chat tier (top-end) — user picks one of these per message.
export const CLAUDE_MAIN_MODELS = ["claude-opus-4-7", "claude-sonnet-4-6"] as const;
export const GEMINI_MAIN_MODELS = [
    "gemini-3.1-pro-preview",
    "gemini-3-flash-preview",
] as const;
// 1. Add our local Ollama models array
export const OLLAMA_MAIN_MODELS = ["gemma4:latest", "gemma3:4b", "llama3.2:3b"] as const;

// Mid-tier (used for tabular review) — user picks one in account settings.
export const CLAUDE_MID_MODELS = ["claude-sonnet-4-6"] as const;
export const GEMINI_MID_MODELS = ["gemini-3-flash-preview"] as const;
// 2. Make Gemma/Llama available for tabular reviews too
export const OLLAMA_MID_MODELS = ["gemma4:latest", "gemma3:4b", "llama3.2:3b"] as const;

// Low-tier (used for title generation, lightweight extractions) — user picks
// one in account settings.
export const CLAUDE_LOW_MODELS = ["claude-haiku-4-5"] as const;
export const GEMINI_LOW_MODELS = ["gemini-3.1-flash-lite-preview"] as const;

export const DEFAULT_MAIN_MODEL = "claude-sonnet-4-6";
export const DEFAULT_TITLE_MODEL = "claude-haiku-4-5";
export const DEFAULT_TABULAR_MODEL = "claude-sonnet-4-6";

const ALL_MODELS = new Set<string>([
    ...CLAUDE_MAIN_MODELS,
    ...GEMINI_MAIN_MODELS,
    ...OLLAMA_MAIN_MODELS, // 3. Include local main models in the validation set
    ...CLAUDE_MID_MODELS,
    ...GEMINI_MID_MODELS,
    ...OLLAMA_MID_MODELS,  // 4. Include local mid models in the validation set
    ...CLAUDE_LOW_MODELS,
    ...GEMINI_LOW_MODELS,
]);

// ---------------------------------------------------------------------------
// Provider inference
// ---------------------------------------------------------------------------

export function providerForModel(model: string): Provider {
    if (model.startsWith("claude")) return "claude";
    if (model.startsWith("gemini")) return "gemini";
    // 5. Route gemma/ollama/llama to the "ollama" provider
    if (model.startsWith("gemma") || model.startsWith("llama") || model.includes("ollama")) return "ollama";
    throw new Error(`Unknown model id: ${model}`);
}

export function resolveModel(id: string | null | undefined, fallback: string): string {
    if (id && ALL_MODELS.has(id)) return id;
    return fallback;
}