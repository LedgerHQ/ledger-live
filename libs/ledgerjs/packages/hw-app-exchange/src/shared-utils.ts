export function isHexadecimal(str: string): boolean {
  return /^[A-F0-9]+$/i.test(str);
}
