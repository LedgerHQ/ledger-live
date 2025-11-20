import { APDU } from "@ledgerhq/device-core/commands/entities/APDU";
import Transport from "@ledgerhq/hw-transport";
import { GetAppAndVersionUnsupportedFormat } from "../errors";

type GetAppAndVersionResult = {
  name: string;
  version: string;
  flags: number | Buffer;
};

const GET_APP_AND_VERSION_APDU: APDU = [0xb0, 0x01, 0x00, 0x00, undefined];

export default async function getAppAndVersion(
  transport: Transport,
  { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
): Promise<GetAppAndVersionResult> {
  const r = await transport.send(...GET_APP_AND_VERSION_APDU, undefined, {
    abortTimeoutMs,
  });

  let i = 0;
  const format = r[i++];

  if (format !== 1) {
    throw new GetAppAndVersionUnsupportedFormat("getAppAndVersion: format not supported");
  }

  const nameLength = r[i++];
  const name = r.subarray(i, i + nameLength).toString("ascii");
  i += nameLength;

  const versionLength = r[i++];
  const version = r.subarray(i, i + versionLength).toString("ascii");
  i += versionLength;

  const flagLength = r[i++];
  const flags = r.subarray(i, i + flagLength);

  return {
    name,
    version,
    flags,
  };
}
