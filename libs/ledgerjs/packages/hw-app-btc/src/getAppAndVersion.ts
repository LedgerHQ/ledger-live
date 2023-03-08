import invariant from "invariant";
import Transport from "@ledgerhq/hw-transport";

export type AppAndVersion = {
  name: string;
  version: string;
  flags: number | Buffer;
};

export const getAppAndVersion = async (
  transport: Transport
): Promise<AppAndVersion> => {
  const r = await transport.send(0xb0, 0x01, 0x00, 0x00);
  let i = 0;
  const format = r[i++];
  invariant(format === 1, "getAppAndVersion: format not supported");
  const nameLength = r[i++];
  const name = r.slice(i, (i += nameLength)).toString("ascii");
  const versionLength = r[i++];
  const version = r.slice(i, (i += versionLength)).toString("ascii");
  const flagLength = r[i++];
  const flags = r.slice(i, (i += flagLength));
  return {
    name,
    version,
    flags,
  };
};
