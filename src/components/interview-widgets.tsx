"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { InterviewWidget } from "@/lib/packing";

function nightsBetween(from: string, to: string): number | null {
  const start = Date.parse(`${from}T00:00:00`);
  const end = Date.parse(`${to}T00:00:00`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 86_400_000);
}

function defaultScaleValue(widget: Extract<InterviewWidget, { type: "scale" }>) {
  if (
    typeof widget.defaultValue === "number" &&
    widget.defaultValue >= widget.min &&
    widget.defaultValue <= widget.max
  ) {
    return widget.defaultValue;
  }
  return Math.round((widget.min + widget.max) / 2);
}

function formatWidgetAnswer(
  widget: InterviewWidget,
  value: string | number | string[] | { from: string; to: string },
): string {
  if (widget.type === "choice" && typeof value === "string") {
    const label =
      widget.options.find((option) => option.value === value)?.label ?? value;
    return `${widget.question} ${label}`;
  }
  if (widget.type === "scale" && typeof value === "number") {
    const unit = widget.unit ? ` ${widget.unit}` : "";
    return `${widget.question} ${value}${unit}`;
  }
  if (widget.type === "multi" && Array.isArray(value)) {
    const labels = value.map(
      (entry) =>
        widget.options.find((option) => option.value === entry)?.label ?? entry,
    );
    return `${widget.question} ${labels.length ? labels.join(", ") : "none"}`;
  }
  if (
    widget.type === "dates" &&
    typeof value === "object" &&
    value !== null &&
    "from" in value &&
    "to" in value
  ) {
    const range = value as { from: string; to: string };
    const nights = nightsBetween(range.from, range.to);
    const nightsLabel =
      nights === null
        ? ""
        : nights === 1
          ? " (1 night)"
          : ` (${nights} nights)`;
    return `${widget.question} ${range.from} to ${range.to}${nightsLabel}`;
  }
  return widget.question;
}

export function InterviewWidgets({
  widgets,
  disabled,
  onSubmit,
}: {
  widgets: InterviewWidget[];
  disabled?: boolean;
  onSubmit: (message: string) => void;
}) {
  const initial = useMemo(() => {
    const choice: Record<string, string> = {};
    const scale: Record<string, number> = {};
    const multi: Record<string, string[]> = {};
    const dates: Record<string, { from: string; to: string }> = {};
    for (const widget of widgets) {
      if (widget.type === "choice") choice[widget.id] = "";
      if (widget.type === "scale") scale[widget.id] = defaultScaleValue(widget);
      if (widget.type === "multi") multi[widget.id] = [];
      if (widget.type === "dates") dates[widget.id] = { from: "", to: "" };
    }
    return { choice, scale, multi, dates };
  }, [widgets]);

  const [choice, setChoice] = useState(initial.choice);
  const [scale, setScale] = useState(initial.scale);
  const [multi, setMulti] = useState(initial.multi);
  const [dates, setDates] = useState(initial.dates);

  const ready = widgets.every((widget) => {
    if (widget.type === "choice") return Boolean(choice[widget.id]);
    if (widget.type === "scale") return typeof scale[widget.id] === "number";
    if (widget.type === "dates") {
      const range = dates[widget.id];
      return Boolean(
        range &&
          range.from &&
          range.to &&
          nightsBetween(range.from, range.to) !== null,
      );
    }
    return true;
  });

  function submit() {
    if (!ready || disabled) return;
    const lines = widgets.map((widget) => {
      if (widget.type === "choice") {
        return formatWidgetAnswer(widget, choice[widget.id] ?? "");
      }
      if (widget.type === "scale") {
        return formatWidgetAnswer(
          widget,
          scale[widget.id] ?? defaultScaleValue(widget),
        );
      }
      if (widget.type === "dates") {
        return formatWidgetAnswer(
          widget,
          dates[widget.id] ?? { from: "", to: "" },
        );
      }
      return formatWidgetAnswer(widget, multi[widget.id] ?? []);
    });
    onSubmit(lines.join("\n"));
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>A couple of details</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {widgets.map((widget) => {
            if (widget.type === "choice") {
              return (
                <FieldSet key={widget.id} data-disabled={disabled || undefined}>
                  <FieldLegend variant="label">{widget.question}</FieldLegend>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    spacing={2}
                    value={choice[widget.id] ?? ""}
                    onValueChange={(value) => {
                      if (value) {
                        setChoice((current) => ({
                          ...current,
                          [widget.id]: value,
                        }));
                      }
                    }}
                    disabled={disabled}
                    className="flex-wrap"
                    aria-label={widget.question}
                  >
                    {widget.options.map((option) => (
                      <ToggleGroupItem key={option.value} value={option.value}>
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FieldSet>
              );
            }

            if (widget.type === "scale") {
              const value = scale[widget.id] ?? defaultScaleValue(widget);
              return (
                <Field
                  key={widget.id}
                  data-disabled={disabled || undefined}
                >
                  <FieldLabel htmlFor={widget.id}>{widget.question}</FieldLabel>
                  <Slider
                    id={widget.id}
                    min={widget.min}
                    max={widget.max}
                    step={widget.step ?? 1}
                    value={[value]}
                    disabled={disabled}
                    onValueChange={(next) =>
                      setScale((current) => ({
                        ...current,
                        [widget.id]: next[0] ?? widget.min,
                      }))
                    }
                  />
                  <FieldDescription>
                    {value}
                    {widget.unit ? ` ${widget.unit}` : ""} · {widget.min}–
                    {widget.max}
                  </FieldDescription>
                </Field>
              );
            }

            if (widget.type === "dates") {
              const range = dates[widget.id] ?? { from: "", to: "" };
              const nights = nightsBetween(range.from, range.to);
              return (
                <FieldSet key={widget.id} data-disabled={disabled || undefined}>
                  <FieldLegend variant="label">{widget.question}</FieldLegend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor={`${widget.id}-from`}>From</FieldLabel>
                      <Input
                        id={`${widget.id}-from`}
                        type="date"
                        value={range.from}
                        disabled={disabled}
                        onChange={(event) =>
                          setDates((current) => ({
                            ...current,
                            [widget.id]: {
                              from: event.target.value,
                              to: current[widget.id]?.to ?? "",
                            },
                          }))
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`${widget.id}-to`}>To</FieldLabel>
                      <Input
                        id={`${widget.id}-to`}
                        type="date"
                        min={range.from || undefined}
                        value={range.to}
                        disabled={disabled}
                        onChange={(event) =>
                          setDates((current) => ({
                            ...current,
                            [widget.id]: {
                              from: current[widget.id]?.from ?? "",
                              to: event.target.value,
                            },
                          }))
                        }
                      />
                    </Field>
                  </div>
                  <FieldDescription>
                    {nights === null
                      ? "Pick a start and end date."
                      : nights === 1
                        ? "1 night"
                        : `${nights} nights`}
                  </FieldDescription>
                </FieldSet>
              );
            }

            const useToggles = widget.options.length <= 7;
            return (
              <FieldSet key={widget.id} data-disabled={disabled || undefined}>
                <FieldLegend variant="label">{widget.question}</FieldLegend>
                {useToggles ? (
                  <ToggleGroup
                    type="multiple"
                    variant="outline"
                    spacing={2}
                    value={multi[widget.id] ?? []}
                    onValueChange={(value) =>
                      setMulti((current) => ({
                        ...current,
                        [widget.id]: value,
                      }))
                    }
                    disabled={disabled}
                    className="flex-wrap"
                    aria-label={widget.question}
                  >
                    {widget.options.map((option) => (
                      <ToggleGroupItem key={option.value} value={option.value}>
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                ) : (
                  <FieldGroup className="gap-3">
                    {widget.options.map((option) => {
                      const checked = (multi[widget.id] ?? []).includes(
                        option.value,
                      );
                      return (
                        <Field
                          key={option.value}
                          orientation="horizontal"
                          data-disabled={disabled || undefined}
                        >
                          <Checkbox
                            id={`${widget.id}-${option.value}`}
                            checked={checked}
                            disabled={disabled}
                            onCheckedChange={(next) => {
                              setMulti((current) => {
                                const existing = current[widget.id] ?? [];
                                const selected =
                                  next === true
                                    ? [...existing, option.value]
                                    : existing.filter(
                                        (value) => value !== option.value,
                                      );
                                return { ...current, [widget.id]: selected };
                              });
                            }}
                          />
                          <FieldLabel
                            htmlFor={`${widget.id}-${option.value}`}
                            className="font-normal"
                          >
                            {option.label}
                          </FieldLabel>
                        </Field>
                      );
                    })}
                  </FieldGroup>
                )}
              </FieldSet>
            );
          })}
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button type="button" onClick={submit} disabled={disabled || !ready}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}
