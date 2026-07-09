const TIME_ZONE = "Asia/Shanghai";

export function startOfShanghaiDay(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return new Date(`${year}-${month}-${day}T00:00:00+08:00`);
}

export function endOfShanghaiDay(date = new Date()) {
  const start = startOfShanghaiDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function parseShanghaiDate(value: string) {
  return new Date(`${value}T00:00:00+08:00`);
}

export function formatDate(date?: Date | null) {
  if (!date) return "未定";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateTime(date?: Date | null) {
  if (!date) return "未定";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getShanghaiClock(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value || 0),
    minute: Number(parts.find((part) => part.type === "minute")?.value || 0),
  };
}

export function isAfterShanghaiReminderTime(date = new Date()) {
  const { hour, minute } = getShanghaiClock(date);
  return hour > 16 || (hour === 16 && minute >= 30);
}
