# openai-chat-stream

Get OpenAI chat response in real-time.

Usage:

```ts
import { getCompletionStream } from "https://deno.land/x/openai-chat-stream/mod.ts";

const stream = getCompletionStream({
  apiKey: "YOUR_OPENAI_API_KEY",
  messages: [
    {
      role: "user",
      content: "How is Deno vs Node.js?",
    },
  ],
});

for await (const token of stream) {
  console.info(token);
}
```
