export function getContactInitial(name: string): string {
  for (const character of name) {
    return character.toUpperCase();
  }

  return "";
}
