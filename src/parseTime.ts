export default function parseTime(timeStr: string): number {
  let nextStr = timeStr;
  let ms = 0.0;
  let nextNumberOfNumbers = timeStr.match(/\d+(\.\d+)?/g)?.length || 0;
  const minusMatch = nextStr.match(/^\s*-\s*(?<next>.*)$/);
  if (minusMatch) {
    nextStr = minusMatch.groups?.next || "";
  }
  while (nextStr) {
    const numberMatch = nextStr.match(/^\s*(?<number>\d+(\.\d+)?|(\.\d+))(?<next>.*)$/);
    if (numberMatch) {
      const number = parseFloat(numberMatch.groups?.number || "0");
      nextStr = numberMatch.groups?.next || "";
      const unitMatch = nextStr.match(/^\s*(?<unit>[^0-9.]*)(?<next>.*)$/);
      if (unitMatch) {
        const unit = unitMatch.groups?.unit.toLowerCase() || "";
        nextStr = unitMatch.groups?.next || "";
        if (unit.startsWith("ms") || unit.startsWith("mil")) {
          ms += number;
        } else if (unit[0] === "d") {
          ms += number * 86400000;
        } else if (unit[0] === "h") {
          ms += number * 3600000;
        } else if (unit[0] === "m") {
          ms += number * 60000;
        } else if (unit[0] === "s") {
          ms += number * 1000;
      } else {
          // console.log("!", number, nextNumberOfNumbers, unitMatch);
          ms += number * 1000 * (60 ** Math.min(2, nextNumberOfNumbers - 1)) * (nextNumberOfNumbers > 3 ? 24 : 1);
        }
        nextNumberOfNumbers -= 1;
      }
    } else {
      nextStr = nextStr.slice(1)
    }
  }
  return ms * (minusMatch ? -1 : 1);
}