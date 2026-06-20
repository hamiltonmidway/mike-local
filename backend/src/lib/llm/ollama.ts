import type {
    StreamChatParams,
    StreamChatResult,
    NormalizedToolCall,
} from "./types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

type OllamaMessage = {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_calls?: any[];
};

export async function streamOllama(
    params: StreamChatParams,
): Promise<StreamChatResult> {
    const {
        model,
        systemPrompt,
        tools = [],
        callbacks = {},
        runTools,
    } = params;
    const maxIter = params.maxIterations ?? 10;

    // Build initial conversation history
    const nativeMessages: OllamaMessage[] = [];
    if (systemPrompt) {
        nativeMessages.push({ role: "system", content: systemPrompt });
    }
    nativeMessages.push(...params.messages.map(m => ({ 
        role: m.role as "user" | "assistant", 
        content: m.content 
    })));

    let fullText = "";

    // Multi-turn iteration loop to handle tool execution rounds
    for (let iter = 0; iter < maxIter; iter++) {
        try {
            const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: model,
                    messages: nativeMessages,
                    tools: tools.length ? tools : undefined, // Ollama accepts standard OpenAI tools
                    stream: true,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.statusText} - ${errorText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error("Could not read response stream from local Ollama");

            let buffer = "";
            let sawThinking = false;
            
            // Map to track tool calls as they stream in
            const rawToolCallsMap = new Map<number, { id: string; name: string; argsStr: string }>();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed = JSON.parse(line);
                        const msg = parsed.message;

                        if (!msg) continue;

                        // 1. Handle regular text stream
                        if (msg.content) {
                            fullText += msg.content;
                            callbacks.onContentDelta?.(msg.content);
                        }

                        // 2. Handle thinking/reasoning stream
                        if (msg.thinking) {
                            sawThinking = true;
                            callbacks.onReasoningDelta?.(msg.thinking);
                        }

                        // 3. Accumulate tool calls from stream chunks
                        if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
                            for (const tc of msg.tool_calls) {
                                const idx = tc.function?.index ?? 0;
                                if (!rawToolCallsMap.has(idx)) {
                                    rawToolCallsMap.set(idx, {
                                        id: tc.id || `call_${Math.random().toString(36).substring(2, 11)}`,
                                        name: tc.function?.name || "",
                                        argsStr: ""
                                    });
                                }
                                const current = rawToolCallsMap.get(idx)!;
                                if (tc.function?.arguments) {
                                    if (typeof tc.function.arguments === "string") {
                                        current.argsStr += tc.function.arguments;
                                    } else {
                                        current.argsStr = JSON.stringify(tc.function.arguments);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        // Ignore partial line JSON parse errors
                    }
                }
            }

            // Close out the reasoning box if the model used one
            if (sawThinking) callbacks.onReasoningBlockEnd?.();

            // Format accumulated tool calls into Mike's normalized format
            const toolCalls: NormalizedToolCall[] = [];
            const nativeToolCallsPayload: any[] = [];

            for (const [idx, rawCall] of rawToolCallsMap.entries()) {
                let parsedArgs = {};
                try {
                    parsedArgs = JSON.parse(rawCall.argsStr || "{}");
                } catch (e) {
                    console.error("Failed to parse tool arguments:", rawCall.argsStr);
                }

                const normalizedCall: NormalizedToolCall = {
                    id: rawCall.id,
                    name: rawCall.name,
                    input: parsedArgs,
                };

                callbacks.onToolCallStart?.(normalizedCall);
                toolCalls.push(normalizedCall);

                // Build exact payload to preserve in Ollama's history
                nativeToolCallsPayload.push({
                    id: rawCall.id,
                    type: "function",
                    function: {
                        name: rawCall.name,
                        arguments: parsedArgs
                    }
                });
            }

            // If no tool calls were requested, we are completely done!
            if (!toolCalls.length || !runTools) {
                break;
            }

            // Run the requested tools (e.g., read_document)
            const results = await runTools(toolCalls);

            // Record the assistant's turn with its tool calls, followed by the tool results
            nativeMessages.push({ 
                role: "assistant", 
                content: "", 
                tool_calls: nativeToolCallsPayload 
            });

            for (const r of results) {
                nativeMessages.push({
                    role: "tool",
                    content: typeof r.content === "string" ? r.content : JSON.stringify(r.content)
                });
            }

        } catch (error) {
            console.error("Failed during local Ollama execution round:", error);
            throw error;
        }
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
                stream: false,
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