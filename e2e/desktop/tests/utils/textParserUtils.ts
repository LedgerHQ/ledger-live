export async function extractNumberFromText(text: string): Promise<number> {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}
