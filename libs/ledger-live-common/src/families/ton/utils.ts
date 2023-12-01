export const getLedgerTonPath = (path: string): number[] => {
  const numPath: number[] = [];
  if (!path) throw Error("[ton] Path is empty");
  if (path.startsWith("m/")) path = path.slice(2);
  const pathEntries = path.split("/");
  if (pathEntries.length !== 6) throw Error(`[ton] Path length is not right ${path}`);
  for (const entry of pathEntries) {
    if (!entry.endsWith("'")) throw Error(`[ton] Path entry is not hardened ${path}`);
    const num = parseInt(entry.slice(0, entry.length - 1));
    if (!Number.isInteger(num) || num < 0 || num >= 0x80000000)
      throw Error(`[ton] Path entry is not right ${path}`);
    numPath.push(num);
  }
  return numPath;
};
