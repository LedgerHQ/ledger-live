export const bip32PathToBytes = (path: string): Buffer => {
  const parts = path.split("/");
  return Buffer.concat(
    parts
      .map(part =>
        part.endsWith("'")
          ? Math.abs(parseInt(part.slice(0, -1))) | 0x80000000
          : Math.abs(parseInt(part)),
      )
      .map(i32 =>
        Buffer.from([(i32 >> 24) & 0xff, (i32 >> 16) & 0xff, (i32 >> 8) & 0xff, i32 & 0xff]),
      ),
  );
};
