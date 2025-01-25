import { createDevice, SoftwareDevice } from "./Device";
import * as CS from "./CommandStream";
import { createApduDevice } from "./ApduDevice";
import Jsonifier from "./CommandStreamJsonifier";

export type { Device } from "./Device";
export type { StreamTreeCipherMode } from "./StreamTreeCipher";
export { StreamTreeCipher } from "./StreamTreeCipher";
export { crypto, DerivationPath } from "./Crypto";
export { PublicKey } from "./PublicKey";
export type { CommandType, Command, CommandBlock } from "./CommandBlock";
export {
  AddMember,
  CloseStream,
  Derive,
  EditMember,
  PublishKey,
  Seed,
  Permissions,
} from "./CommandBlock";
export { APDU, TRUSTCHAIN_APP_NAME } from "./ApduDevice";
export { CommandStreamEncoder } from "./CommandStreamEncoder";
export { CommandStreamDecoder } from "./CommandStreamDecoder";
export { Challenge, PubKeyCredential } from "./SeedId";
export { StreamTree } from "./StreamTree";
export { SoftwareDevice };

/**
 *
 */
export class CommandStream extends CS.default {}
/**
 *
 */
export class CommandStreamJsonifier extends Jsonifier {}

/**
 *
 */
export const device = {
  software: createDevice,
  apdu: createApduDevice,
};
