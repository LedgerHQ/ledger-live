import Transport from "@ledgerhq/hw-transport";
import { hexBuffer, splitPath } from "../utils";

const CLA = 0xe0;

export const signTIP712HashedMessage = (
  transport: Transport,
  path: string,
  domainSeparatorHex: string,
  hashStructMessageHex: string,
): Promise<string> => {
  const domainSeparator = hexBuffer(domainSeparatorHex);
  const hashStruct = hexBuffer(hashStructMessageHex);
  const paths = splitPath(path);
  const buffer = Buffer.alloc(1 + paths.length * 4 + 32 + 32, 0);

  let offset = 0;
  buffer[0] = paths.length;
  paths.forEach((element, index) => {
    buffer.writeUint32BE(element, 1 + 4 * index);
  });

  offset = 1 + 4 * paths.length;
  domainSeparator.copy(buffer, offset);
  offset += 32;
  hashStruct.copy(buffer, offset);

  return transport.send(CLA, 0x0c, 0x00, 0x00, buffer).then(response => {
    return response.slice(0, 65).toString("hex");
  });
};
