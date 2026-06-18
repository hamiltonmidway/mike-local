import { MODELS, type ModelOption } from "../components/assistant/ModelToggle";

// 1. Add "ollama" to the allowed provider types
export type ModelProvider = "claude" | "gemini" | "ollama";

export function getModelProvider(modelId: string): ModelProvider | null {
    const model = MODELS.find((m) => m.id === modelId);
    if (!model) return null;
    // Explicitly check for each group now that we have three
    if (model.group === "Anthropic") return "claude";
    if (model.group === "Google") return "gemini";
    return "ollama";
}

export function isModelAvailable(
    modelId: string,
    apiKeys: { claudeApiKey: string | null; geminiApiKey: string | null },
): boolean {
    const provider = getModelProvider(modelId);
    if (!provider) return false;
    // Ollama is local, so it is always available without an external API key
    if (provider === "claude" || provider === "ollama") return true;
    return !!apiKeys.geminiApiKey?.trim();
}

export function isProviderAvailable(
    provider: ModelProvider,
    apiKeys: { claudeApiKey: string | null; geminiApiKey: string | null },
): boolean {
    if (provider === "claude" || provider === "ollama") return true;
    return !!apiKeys.geminiApiKey?.trim();
}

export function providerLabel(provider: ModelProvider): string {
    if (provider === "claude") return "Anthropic (Claude)";
    if (provider === "gemini") return "Google (Gemini)";
    return "Ollama (Local)";
}

export function modelGroupToProvider(
    group: ModelOption["group"],
): ModelProvider {
    if (group === "Anthropic") return "claude";
    if (group === "Google") return "gemini";
    return "ollama";
}