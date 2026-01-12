import agent from "../config/agent.config.js";
import { getMemory, addMemory } from "./memory.service.js";

export async function getAIReply(callSid, userText) {
  addMemory(callSid, "user", userText, agent.memorySize);

  const history = getMemory(callSid)
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  const prompt = `
${agent.systemPrompt}

Conversation:
${history}

User said (possibly unclear): ${userText}
Assistant (give a helpful answer immediately):
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  const data = await response.json();

  const reply =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!reply) {
    throw new Error("Empty Gemini response");
  }

  addMemory(callSid, "assistant", reply, agent.memorySize);
  return reply;
}
