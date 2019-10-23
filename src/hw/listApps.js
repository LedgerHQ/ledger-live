// @flow
import type Transport from "@ledgerhq/hw-transport";

export default async (transport: Transport<*>) => {
  const payload = await transport.send(0xe0, 0xde, 0, 0);

  if (payload[0] !== 0x01) {
    throw new Error("unknown listApps format");
  }

  let i = 1;
  const apps = [];
  while (i < payload.length - 2) {
    const length = payload[i];
    i++;
    const blocks = payload.readUInt16BE(i);
    i += 2;
    const flags = payload.readUInt16BE(i);
    i += 2;
    const hashCodeData = payload.slice(i, i + 32).toString("hex");
    i += 32;
    const hash = payload.slice(i, i + 32).toString("hex");
    i += 32;
    const nameLength = payload[i];
    i++;
    if (length !== nameLength + 70) {
      throw new Error("invalid listApps length data");
    }
    const name = payload.slice(i, i + nameLength).toString("ascii");
    i += nameLength;
    apps.push({
      name,
      hash,
      hashCodeData,
      blocks,
      flags
    });
  }
  return apps;
};
