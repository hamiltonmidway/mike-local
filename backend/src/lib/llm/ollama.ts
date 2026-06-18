import type {
    StreamChatParams,
    StreamChatResult,
    NormalizedToolCall,
} from "./types";

// Ollama's local URL defaults to port 11434 if not specified in your env file
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function streamOllama(
    params: StreamChatParams,
): Promise<StreamChatResult> {
    const {
        model,
        systemPrompt,
        messages,
        callbacks = {},
    } = params;

    let fullText = "";

    // Build the request payload matching Ollama's Chat API
    // We inject the system prompt as a system message at the beginning
    const formattedMessages = [];
    if (systemPrompt) {
        formattedMessages.push({ role: "system", content: systemPrompt });
    }
    formattedMessages.push(...messages.map(m => ({ role: m.role, content: m.content })));

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model, // This will pass "gemma4:latest"
                messages: formattedMessages,
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error("Could not read response stream from local Ollama");
        }

        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            
            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const parsed = JSON.parse(line);
                    const delta = parsed.message?.content || "";
                    if (delta) {
                        fullText += delta;
                        // Push the stream token directly to the frontend interface
                        callbacks.onContentDelta?.(delta);
                    }
                } catch (e) {
                    // Ignore JSON parsing errors for partial lines
                }
            }
        }
    } catch (error) {
        console.error("Failed to connect to local Ollama instance:", error);
        throw error;
    }

    return { fullText };
}

export async function completeOllamaText(params: {
    model: string;
    systemPrompt?: string;
    user: string;
    maxTokens?: number;
}): Promise<string> {
    const formattedMessages = [];
    if (params.systemPrompt) {
        formattedMessages.push({ role: "system", content: params.systemPrompt });
    }
    formattedMessages.push({ role: "user", content: params.user });

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: params.model,
                messages: formattedMessages,
                stream: false, // Standard completion doesn't need to stream
            }),
        });

        if (!response.ok) return "Error generating text from local Ollama model.";

        const data = await response.json();
        return data.message?.content || "";
    } catch (error) {
        console.error("Ollama completion error:", error);
        return "Failed to communicate with local Ollama.";
    }
}