import { type NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body["query"];

  // Vercel Redeployment Stage, redeployment 1 occurred here.
  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const completion = await client.chat.completions.create({
    stream: true,
    model: "llama3-70b-8192",
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });

  return new NextResponse(completion.toReadableStream(), {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    },
  });
}
