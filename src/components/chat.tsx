"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { BriefcaseIcon, SendIcon } from "lucide-react";
import { InterviewWidgets } from "@/components/interview-widgets";
import { PackingChecklist } from "@/components/packing-checklist";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bubble,
  BubbleContent,
} from "@/components/ui/bubble";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import {
  mergePackingProgress,
  type InterviewWidget,
  type PackingList,
  type PackingProgress,
} from "@/lib/packing";

interface SkillInfo {
  name: string;
  description: string;
}

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  loadedSkills?: string[];
  widgets?: InterviewWidget[];
}

const START_PROMPT = "Help me pack";

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Chat({ initialSkills }: { initialSkills: SkillInfo[] }) {
  const [skills, setSkills] = useState<SkillInfo[]>(initialSkills);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<PackingProgress | null>(null);

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

  async function send(text: string, nextProgress = progress) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const nextMessages: ChatTurn[] = [
      ...messages,
      { id: nextId(), role: "user", content: trimmed },
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
          packingList: nextProgress,
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        loadedSkills?: string[];
        widgets?: InterviewWidget[];
        packingList?: PackingList | null;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status}).`);
      }

      if (data.packingList) {
        setProgress((current) => mergePackingProgress(current, data.packingList!));
      }

      setMessages([
        ...nextMessages,
        {
          id: nextId(),
          role: "assistant",
          content: data.reply ?? "",
          loadedSkills: data.loadedSkills ?? [],
          widgets: data.widgets ?? [],
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
      void send(input);
    }
  }

  function toggleItem(id: string) {
    setProgress((current) => {
      if (!current) return current;
      const checked = current.checkedIds.includes(id)
        ? current.checkedIds.filter((entry) => entry !== id)
        : [...current.checkedIds, id];
      return { ...current, checkedIds: checked };
    });
  }

  function dismissItem(id: string) {
    setProgress((current) => {
      if (!current) return current;
      return {
        ...current,
        dismissedIds: current.dismissedIds.includes(id)
          ? current.dismissedIds
          : [...current.dismissedIds, id],
        checkedIds: current.checkedIds.filter((entry) => entry !== id),
      };
    });
  }

  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const lastWasAssistant =
    messages.length > 0 && messages[messages.length - 1]?.role === "assistant";
  const activeWidgets =
    lastWasAssistant && !pending ? (lastAssistant?.widgets ?? []) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="font-heading text-sm font-medium text-balance">
            Packing planner
          </h1>
          <p className="text-xs text-muted-foreground">
            Interview first, then a list you can tick off.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void send(START_PROMPT)}
          disabled={pending}
        >
          <BriefcaseIcon data-icon="inline-start" />
          Help me pack
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex shrink-0 flex-col gap-3 border-b border-border p-4 md:w-64 lg:border-r lg:border-b-0">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Skills</p>
            <p className="text-xs text-muted-foreground">
              Names and descriptions only. Full instructions load when the agent
              needs them.
            </p>
          </div>
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills installed.</p>
          ) : (
            <ItemGroup>
              {skills.map((skill) => (
                <Item key={skill.name} size="sm" variant="muted">
                  <ItemContent>
                    <ItemTitle>
                      <Badge variant="outline">{skill.name}</Badge>
                    </ItemTitle>
                    <ItemDescription>{skill.description}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          )}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <MessageScrollerProvider autoScroll>
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="mx-auto w-full max-w-2xl px-4 py-6">
                  {messages.length === 0 && !pending ? (
                    <MessageScrollerItem messageId="empty">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <BriefcaseIcon />
                          </EmptyMedia>
                          <EmptyTitle>Ask about a trip</EmptyTitle>
                          <EmptyDescription>
                            Destination in your own words. Luggage, nights, and
                            activities get a control each.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button
                            type="button"
                            onClick={() => void send(START_PROMPT)}
                          >
                            Help me pack
                          </Button>
                        </EmptyContent>
                      </Empty>
                    </MessageScrollerItem>
                  ) : null}

                  {messages.map((message, index) => {
                    const isLatestAssistant =
                      message.role === "assistant" &&
                      index === messages.length - 1;
                    const widgets = message.widgets ?? [];
                    const align = message.role === "user" ? "end" : "start";
                    return (
                      <MessageScrollerItem
                        key={message.id}
                        messageId={message.id}
                        scrollAnchor={message.role === "user"}
                      >
                        <Message align={align}>
                          <MessageContent>
                            <MessageHeader>
                              {message.role === "user" ? "You" : "Assistant"}
                            </MessageHeader>
                            {message.content ? (
                              <Bubble
                                variant={
                                  message.role === "user" ? "default" : "tinted"
                                }
                                align={align}
                              >
                                <BubbleContent className="whitespace-pre-wrap">
                                  {message.content}
                                </BubbleContent>
                              </Bubble>
                            ) : null}
                            {widgets.length > 0 ? (
                              isLatestAssistant && !pending ? (
                                <InterviewWidgets
                                  widgets={widgets}
                                  disabled={pending}
                                  onSubmit={(value) => void send(value)}
                                />
                              ) : (
                                <Marker>
                                  <MarkerContent>
                                    Answered with the controls above.
                                  </MarkerContent>
                                </Marker>
                              )
                            ) : null}
                            {message.role === "assistant" &&
                            message.loadedSkills &&
                            message.loadedSkills.length > 0 ? (
                              <MessageFooter>
                                <span className="flex flex-wrap gap-1.5">
                                  {message.loadedSkills.map((name) => (
                                    <Badge key={name} variant="outline">
                                      {name}
                                    </Badge>
                                  ))}
                                </span>
                              </MessageFooter>
                            ) : null}
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    );
                  })}

                  {pending ? (
                    <MessageScrollerItem messageId="pending">
                      <Message align="start">
                        <MessageContent>
                          <span className="shimmer flex items-center gap-2 text-sm text-muted-foreground">
                            <Spinner />
                            Thinking
                          </span>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  ) : null}

                  {error ? (
                    <MessageScrollerItem messageId="error">
                      <Alert variant="destructive">
                        <AlertTitle>Could not send</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </MessageScrollerItem>
                  ) : null}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton variant="outline" />
            </MessageScroller>
          </MessageScrollerProvider>

          <div className="border-t border-border p-4">
            <form
              className="mx-auto w-full max-w-2xl"
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
              }}
            >
              <InputGroup>
                <InputGroupTextarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={
                    activeWidgets.length > 0
                      ? "Or type a destination or extra detail…"
                      : "Where are you going, and when?"
                  }
                  disabled={pending}
                  rows={3}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupButton
                    type="submit"
                    variant="default"
                    disabled={pending || !input.trim()}
                  >
                    {pending ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <SendIcon data-icon="inline-start" />
                    )}
                    Send
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </form>
          </div>
        </div>

        {progress ? (
          <PackingChecklist
            progress={progress}
            onToggle={toggleItem}
            onDismiss={dismissItem}
          />
        ) : null}
      </div>
    </div>
  );
}
