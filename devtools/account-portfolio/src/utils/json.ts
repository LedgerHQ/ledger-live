function parse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export const isJsonArray = (text: string): boolean => Array.isArray(parse(text));

export function isJsonObject(text: string): boolean {
  const value = parse(text);
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
