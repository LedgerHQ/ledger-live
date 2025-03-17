export async function extractNumberFromText(text: string): Promise<number> {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export const extractNumberFromString = (input: string | undefined): string => {
  const match = input?.match(/[\d.]+/);
  return match ? match[0] : "";
};

export function capitalizeFirstLetter(text: string) {
  return text[0].toUpperCase() + text.slice(1).toLowerCase();
}
