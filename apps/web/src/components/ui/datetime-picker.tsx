"use client";

import * as React from "react";
import { format } from "date-fns";
import { tr as trLocale } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  parseDatetimeLocalString,
  timePartFromDatetimeLocal,
  toDatetimeLocalString,
} from "@/lib/datetime-local";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  error?: boolean;
}

export function DateTimePicker({
  value = "",
  onChange,
  placeholder = "Tarih ve saat seçin",
  disabled,
  id,
  className,
  error,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(
    () => parseDatetimeLocalString(value),
    [value],
  );

  const timeValue = React.useMemo(
    () => timePartFromDatetimeLocal(value),
    [value],
  );

  const label = React.useMemo(() => {
    if (!selectedDate) return null;
    return format(selectedDate, "d MMMM yyyy HH:mm", { locale: trLocale });
  }, [selectedDate]);

  const onSelectDay = (day: Date | undefined) => {
    if (!day) {
      onChange("");
      return;
    }
    const prev = parseDatetimeLocalString(value);
    const h = prev?.getHours() ?? 0;
    const m = prev?.getMinutes() ?? 0;
    const merged = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      h,
      m,
      0,
      0,
    );
    onChange(toDatetimeLocalString(merged));
  };

  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    const base =
      parseDatetimeLocalString(value) ??
      new Date(new Date().setHours(0, 0, 0, 0));
    const [hh, mm] = t.split(":").map((x) => Number.parseInt(x, 10));
    const merged = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      Number.isFinite(hh) ? hh : 0,
      Number.isFinite(mm) ? mm : 0,
      0,
      0,
    );
    onChange(toDatetimeLocalString(merged));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-auto min-h-10 w-full justify-start rounded-xl border border-border/40 bg-muted/50 px-3 py-2.5 text-left text-sm font-normal hover:bg-muted/60",
            !label && "text-muted-foreground",
            error && "border-destructive/60",
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
          {label ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDay}
          autoFocus
          defaultMonth={selectedDate ?? new Date()}
        />
        <div className="flex items-center gap-2 border-t border-border/40 p-3">
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
            Saat
          </span>
          <input
            type="time"
            step={60}
            value={timeValue}
            onChange={onTimeChange}
            className={cn(
              "flex-1 rounded-lg border border-border/50 bg-muted/40 px-2 py-1.5 text-sm text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
            )}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
