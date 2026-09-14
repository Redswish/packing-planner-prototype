"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { BriefcaseIcon, SendIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

interface SkillInfo {
  name: string;
  description: string;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  loadedSkills?: string[];
}

export function Chat({ initialSkills }: { initialSkills: SkillInfo[] }) {
  const [skills, setSkills] = useState<SkillInfo[]>(initialSkills);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/skills")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { skills?: SkillInfo[] }) => {
        if (!cancelled) setSkills(data.skills ?? []);
      })
      .catch(() => {
        if (!cancelled) setSkills([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;

    const nextMessages: ChatTurn[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        loadedSkills?: string[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status}).`);
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.reply ?? "",
          loadedSkills: data.loadedSkills ?? [],
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-3 border-b border-border p-4 md:w-64 md:border-r md:border-b-0">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Skills</p>
          <p className="text-xs text-muted-foreground">
            Names and descriptions only. Full instructions load when the agent
            needs them.
          </p>
        </div>
        <Separator />
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills installed.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {skills.map((skill) => (
              <li key={skill.name} className="flex flex-col gap-1">
                <Badge variant="outline">{skill.name}</Badge>
                <p className="text-xs text-muted-foreground text-pretty">
                  {skill.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
            {messages.length === 0 && !pending ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BriefcaseIcon />
                  </EmptyMedia>
                  <EmptyTitle>Ask about a trip</EmptyTitle>
                  <EmptyDescription>
                    Describe where you are going and when. The agent loads
                    skills as it works.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className="flex flex-col gap-2"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {message.role === "user" ? "You" : "Assistant"}
                </p>
                <div className="rounded-xl bg-muted px-3 py-2">
                  <p className="whitespace-pre-wrap text-sm text-pretty">
                    {message.content}
                  </p>
                </div>
                {message.role === "assistant" &&
                message.loadedSkills &&
                message.loadedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {message.loadedSkills.map((name) => (
                      <Badge key={name} variant="secondary">
                        {name}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}

            {pending ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Thinking
              </div>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not send</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border p-4">
          <form
            className="mx-auto flex w-full max-w-2xl flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Where are you going, and when?"
              disabled={pending}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={pending || !input.trim()}>
                {pending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <SendIcon data-icon="inline-start" />
                )}
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
