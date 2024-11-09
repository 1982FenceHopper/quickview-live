"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Github, SendHorizonal } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface MessageDefinition {
  role: string;
  message: string;
  isStreaming: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Array<MessageDefinition>>([]);
  const [input, setInput] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const renderMarkdown = (markdown: string) => {
    const rawHtml = marked(markdown);
    const cleanHtml = DOMPurify.sanitize(rawHtml as string);
    return { __html: cleanHtml };
  };

  const requestNewResponse = useCallback(async (input: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "assistant", message: "", isStreaming: true },
    ]);

    const response = await fetch("/api/modelCompletion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: input }),
    });

    if (!response.body) return;

    let buffer = "";

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;
          try {
            const jsonData = JSON.parse(line);
            if (jsonData.choices[0].finish_reason != null) {
              break;
            } else {
              setMessages((prev) =>
                prev.map((msg, index) =>
                  index === prev.length - 1
                    ? {
                        ...msg,
                        message:
                          msg.message + jsonData.choices[0].delta.content,
                      }
                    : msg
                )
              );
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }
      }
    }

    setMessages((prev) =>
      prev.map((msg, index) =>
        index === prev.length - 1 ? { ...msg, isStreaming: false } : msg
      )
    );
  }, []);

  const handleUserMessage = (input: string) => {
    const newData: MessageDefinition = {
      role: "user",
      message: input,
      isStreaming: false,
    };

    setMessages((prev: MessageDefinition[]) => [...prev, newData]);
    requestNewResponse(input);
  };

  return (
    <div className="flex flex-col min-w-screen min-h-screen overflow-clip p-2">
      <div className="inline-flex  border-b-[1px] py-2 px-8 align-middle">
        <div className="font-bold text-2xl grow">QuickView Chat</div>
        <Button variant={"ghost"} className="border-[1px] rounded-md">
          <Github size={16} />
          GitHub
        </Button>
      </div>
      <ScrollArea className="mt-4 rounded-md border-[1px] w-full min-h-[72vh] p-4">
        {messages &&
          messages.map((_v, _i) => (
            <div
              key={_i}
              className="rounded-md border-[1px] max-w-[48vw] p-4 mb-2"
            >
              <div className="font-bold text-xl mb-2">{_v.role}:</div>
              {_v.isStreaming ? (
                <div className="bg-muted p-2 rounded-md border-[1px] border-[#6c6c6c]">
                  <pre>{_v.message}</pre>
                  <span className="animate-pulse">▌</span>
                </div>
              ) : (
                <div
                  className="bg-muted p-2 rounded-md border-[1px] border-[#6c6c6c]"
                  dangerouslySetInnerHTML={renderMarkdown(_v.message)}
                />
              )}
            </div>
          ))}
      </ScrollArea>
      <div className="mt-2 grid gap-2">
        <Textarea
          placeholder="Say something..."
          className=""
          ref={textareaRef}
          onInputCapture={(e) => {
            // @ts-expect-error For some reason, it can't retrieve all attributes for e.target
            setInput(e.target.value);
          }}
        />
        <Button
          onClickCapture={() => {
            handleUserMessage(input);
            textareaRef.current!.value = "";
          }}
        >
          <SendHorizonal size={16} />
          Send
        </Button>
      </div>
    </div>
  );
}
