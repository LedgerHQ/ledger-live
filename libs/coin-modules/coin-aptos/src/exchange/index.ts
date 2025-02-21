import BIPPath from "bip32-path";

export const pathToBuffer = (originalPath: string): Buffer => {
  const path = originalPath
    .split("/")
    .filter(value => value !== "m")
    .map(value => (value.endsWith("'") || value.endsWith("h") ? value : value + "'"))
    .join("/");
  const pathNums: number[] = BIPPath.fromString(path).toPathArray();
  const buf = Buffer.alloc(1 + pathNums.length * 4);
  buf.writeUInt8(pathNums.length, 0);
  for (const [i, num] of pathNums.entries()) {
    buf.writeUInt32BE(num, 1 + i * 4);
  }
  return buf;
};
