/** The items of a list typed or pasted by hand: separated by lines, spaces or commas, once each. */
export function splitList(text: string): string[] {
  return [...new Set(text.split(/[\s,;]+/).filter(item => item.length > 0))];
}
