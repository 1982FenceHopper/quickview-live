import { type NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: NextRequest, res: NextResponse) {
  const body = await req.json();
  const message = body["query"];

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

  return new NextResponse<ReadableStream>(completion.toReadableStream(), {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    },
  });
}
