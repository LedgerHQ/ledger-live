import { createDevice } from "./Device";
import * as CS from "./CommandStream";
import { createApduDevice } from "./ApduDevice";
import Jsonifier from "./CommandStreamJsonifier";

export type { Device } from "./Device";
export type { StreamTreeCipherMode } from "./StreamTreeCipher";
export { StreamTreeCipher } from "./StreamTreeCipher";
export { crypto } from "./Crypto";
export { PublicKey } from "./PublicKey";
export type { CommandType, Command, CommandBlock } from "./CommandBlock";
export { AddMember, CloseStream, Derive, EditMember, PublishKey, Seed } from "./CommandBlock";
export { APDU } from "./ApduDevice";
export { CommandStreamEncoder } from "./CommandStreamEncoder";
export { Challenge, PubKeyCredential } from "./SeedId";

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
