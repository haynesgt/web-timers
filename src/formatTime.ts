function formatTimeVeryShort(ms: number): string {
  if (ms >= 86400000) {
    return `${Math.floor(ms / 86400000)}d`;
  }
  if (ms >= 3600000) {
    return `${Math.floor(ms / 3600000)}h`;
  }
  if (ms >= 60000) {
    return `${Math.floor(ms / 60000)}m`;
  }
  if (ms >= 1000) {
    return `${Math.floor(ms / 1000)}s`;
  }
  return `${Math.round(ms)}ms`;
}

export default function formatTime(ms: number, {short} = {short: false as (boolean | "very")}): string {
  if (short === "very") {
    return formatTimeVeryShort(ms);
  }
  let str = "";
  const negative = ms < 0;
  if (negative) {
    ms = -ms;
  }
  let nextMs = ms;
  if ((short ? nextMs : ms) >= 86400000) {
    const days = Math.floor(nextMs / 86400000);
    str += `${days}d`;
    nextMs -= days * 86400000;
  }
  if ((short ? nextMs : ms) >= 3600000) {
    const hours = Math.floor(nextMs / 3600000);
    str += `${hours.toString().padStart(2, "0")}h`;
    nextMs -= hours * 3600000;
  }
  if ((short ? nextMs : ms) >= 60000) {
    const minutes = Math.floor(nextMs / 60000);
    str += `${minutes.toString().padStart(2, "0")}m`;
    nextMs -= minutes * 60000;
  }
  if ((short ? nextMs : ms) >= 1000) {
    const seconds = Math.floor(nextMs / 1000);
    str += `${seconds.toString().padStart(2, "0")}`;
    nextMs -= seconds * 1000;
  }
  if (nextMs >= 1 || !short) {
    str += `.${Math.round(nextMs).toString().padStart(3, "0")}`;
  }
  if (str[0] === "0") {
    str = str.slice(1);
  }
  if (negative) {
    str = "-" + str;
  }
  return str;
}