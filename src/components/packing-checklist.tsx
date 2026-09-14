"use client";

import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  PACKING_GROUPS,
  visibleItems,
  type PackingItem,
  type PackingProgress,
} from "@/lib/packing";

function ownersInOrder(items: PackingItem[]): string[] {
  const seen: string[] = [];
  for (const item of items) {
    const owner = item.owner.toLowerCase() === "shared" ? "shared" : item.owner;
    if (!seen.includes(owner)) seen.push(owner);
  }
  return seen.sort((a, b) => {
    if (a === "shared") return 1;
    if (b === "shared") return -1;
    return a.localeCompare(b);
  });
}

function ownerLabel(owner: string): string {
  return owner === "shared" ? "Shared" : owner;
}

export function PackingChecklist({
  progress,
  onToggle,
  onDismiss,
}: {
  progress: PackingProgress;
  onToggle: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const items = visibleItems(progress);
  const checked = new Set(progress.checkedIds);
  const owners = ownersInOrder(items);
  const packedCount = items.filter((item) => checked.has(item.id)).length;
  const showOwners = owners.length > 1;

  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col border-t border-border lg:w-[26rem] lg:border-t-0 lg:border-l">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{progress.list.title ?? "Packing list"}</CardTitle>
          <CardDescription>
            {packedCount} of {items.length} packed
            {progress.dismissedIds.length
              ? ` · ${progress.dismissedIds.length} dismissed`
              : ""}
          </CardDescription>
          {progress.list.recap ? (
            <CardDescription>{progress.list.recap}</CardDescription>
          ) : null}
          {progress.list.weatherSummary ? (
            <CardDescription>{progress.list.weatherSummary}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="px-4 pb-4">
              <FieldGroup>
                {owners.map((owner) => {
                  const ownerItems = items.filter((item) =>
                    owner === "shared"
                      ? item.owner.toLowerCase() === "shared"
                      : item.owner === owner,
                  );
                  return (
                    <div key={owner} className="flex flex-col gap-4">
                      {showOwners ? (
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          {ownerLabel(owner)}
                        </p>
                      ) : null}
                      {PACKING_GROUPS.map((group) => {
                        const groupItems = ownerItems.filter(
                          (item) => item.group === group.id,
                        );
                        if (groupItems.length === 0) return null;
                        return (
                          <FieldSet key={`${owner}-${group.id}`}>
                            <FieldLegend variant="label">
                              {group.label}
                            </FieldLegend>
                            <FieldGroup className="gap-3">
                              {groupItems.map((item) => {
                                const packed = checked.has(item.id);
                                return (
                                  <Field
                                    key={item.id}
                                    orientation="horizontal"
                                  >
                                    <Checkbox
                                      id={item.id}
                                      checked={packed}
                                      onCheckedChange={() => onToggle(item.id)}
                                    />
                                    <FieldContent>
                                      <FieldLabel
                                        htmlFor={item.id}
                                        className={cn(
                                          "font-normal",
                                          packed &&
                                            "text-muted-foreground line-through",
                                        )}
                                      >
                                        {item.quantity} {item.label}
                                        {item.critical ? (
                                          <Badge variant="outline">
                                            Critical
                                          </Badge>
                                        ) : null}
                                      </FieldLabel>
                                      {item.rationale ? (
                                        <FieldDescription>
                                          {item.rationale}
                                        </FieldDescription>
                                      ) : null}
                                      {item.weatherNote ? (
                                        <FieldDescription>
                                          {item.weatherNote}
                                        </FieldDescription>
                                      ) : null}
                                    </FieldContent>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-xs"
                                      aria-label={`Dismiss ${item.label}`}
                                      onClick={() => onDismiss(item.id)}
                                    >
                                      <XIcon />
                                    </Button>
                                  </Field>
                                );
                              })}
                            </FieldGroup>
                          </FieldSet>
                        );
                      })}
                    </div>
                  );
                })}
              </FieldGroup>
            </div>
          </ScrollArea>
        </CardContent>
        {progress.list.notes.length > 0 ? (
          <CardFooter className="flex-col items-start gap-1.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              For this trip
            </p>
            <ul className="flex flex-col gap-1">
              {progress.list.notes.map((note) => (
                <li key={note} className="text-xs text-pretty text-muted-foreground">
                  {note}
                </li>
              ))}
            </ul>
          </CardFooter>
        ) : null}
      </Card>
    </aside>
  );
}
