export default function formatTime(ms: number): string {
  let str = "";
  const negative = ms < 0;
  if (negative) {
    ms = -ms;
  }
  let nextMs = ms;
  if (nextMs >= 86400000) {
    const days = Math.floor(nextMs / 86400000);
    str += `${days}d`;
    nextMs -= days * 86400000;
  }
  if (ms >= 3600000) {
    const hours = Math.floor(nextMs / 3600000);
    str += `${hours.toString().padStart(2, "0")}h`;
    nextMs -= hours * 3600000;
  }
  if (ms >= 60000) {
    const minutes = Math.floor(nextMs / 60000);
    str += `${minutes.toString().padStart(2, "0")}m`;
    nextMs -= minutes * 60000;
  }
  if (ms >= 1000) {
    const seconds = Math.floor(nextMs / 1000);
    str += `${seconds.toString().padStart(2, "0")}`;
    nextMs -= seconds * 1000;
  }
  str += `.${Math.round(nextMs).toString().padStart(3, "0")}`;
  if (str[0] === "0") {
    str = str.slice(1);
  }
  if (negative) {
    str = "-" + str;
  }
  return str;
}