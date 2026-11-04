function parse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export const isJsonArray = (text: string): boolean => Array.isArray(parse(text));
