import { TextLineStream } from "https://deno.land/std@0.178.0/streams/text_line_stream.ts";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function* getCompletionStream(
  options: {
    messages: Message[];
    params?: {
      temperature?: number;
      top_p?: number;
      stop?: string | string[];
      max_tokens?: number;
      presence_penalty?: number;
      frequency_penalty?: number;
      logit_bias?: number;
      user?: string;
    };
    apiKey: string;
    onFinished?: (reason: string) => void;
  },
) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + options.apiKey,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: options.messages,
      stream: true,
      ...options.params,
    }),
  });

  if (!resp.ok) {
    const json = await resp.json();
    if (json.error) {
      throw new Error(`API error ${json.error.code}`);
    } else {
      console.error(json);
      throw new Error(`Unknown API response`);
    }
  }

  for await (const json of readStreamAsEvents(resp.body!)) {
    const { delta, finish_reason } = json.choices[0];
    const { content } = delta;
    if (finish_reason) {
      options.onFinished?.(finish_reason);
      break;
    }
    if (content) {
      yield content as string;
    }
  }
}

async function* readStreamAsEvents(stream: ReadableStream<Uint8Array>) {
  for await (const text of readStreamAsTextLines(stream)) {
    if (!text) continue;
    if (text === "data: [DONE]") break;
    if (!text.startsWith("data: ")) throw new Error("Unexpected text: " + text);
    const json = JSON.parse(text.slice(6));
    yield json;
  }
}

async function* readStreamAsTextLines(stream: ReadableStream<Uint8Array>) {
  const linesReader = stream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
    .getReader();
  while (true) {
    const { value, done } = await linesReader.read();
    if (done) break;
    yield value;
  }
}
