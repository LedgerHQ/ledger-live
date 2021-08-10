import Transport from "@ledgerhq/hw-transport"; // TODO make it observable style

export default async (transport: Transport) => {
  const payload = await transport.send(0xe0, 0xde, 0, 0);
  const apps: Array<{
    name: string;
    hash: string;
    hashCodeData: string;
    blocks: number;
    flags: number;
  }> = [];
  let data = payload;

  // more than the status bytes
  while (data.length > 2) {
    if (payload[0] !== 0x01) {
      throw new Error("unknown listApps format");
    }

    let i = 1;

    while (i < data.length - 2) {
      const length = data[i];
      i++;
      const blocks = data.readUInt16BE(i);
      i += 2;
      const flags = data.readUInt16BE(i);
      i += 2;
      const hashCodeData = data.slice(i, i + 32).toString("hex");
      i += 32;
      const hash = data.slice(i, i + 32).toString("hex");
      i += 32;
      const nameLength = data[i];
      i++;

      if (length !== nameLength + 70) {
        throw new Error("invalid listApps length data");
      }

      const name = data.slice(i, i + nameLength).toString("ascii");
      i += nameLength;
      apps.push({
        name,
        hash,
        hashCodeData,
        blocks,
        flags,
      });
    }

    // continue
    data = await transport.send(0xe0, 0xdf, 0, 0);
  }

  return apps;
};
