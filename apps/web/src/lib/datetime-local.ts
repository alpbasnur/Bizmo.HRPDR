/** Tarayıcı `datetime-local` ile uyumlu `YYYY-MM-DDTHH:mm` (yerel saat). */

export function parseDatetimeLocalString(
  value: string | undefined,
): Date | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  const [datePart = "", timePart = "00:00"] = trimmed.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const tp = timePart.slice(0, 5);
  const [hh = 0, mm = 0] = tp.split(":").map((x) => parseInt(x, 10));
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

export function toDatetimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function timePartFromDatetimeLocal(value: string | undefined): string {
  if (!value?.includes("T")) return "00:00";
  const t = value.split("T")[1]?.slice(0, 5) ?? "";
  return /^\d{2}:\d{2}$/.test(t) ? t : "00:00";
}
