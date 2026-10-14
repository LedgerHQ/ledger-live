/** `h`, `H` and `'` all mark a hardened segment (BIP-380); the canonical spelling is `h`. */
export const canonicalPath = (path: string) => path.replaceAll("'", "h").replaceAll("H", "h");
