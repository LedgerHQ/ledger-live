// Referenced, not just declared: consumers compile these sources, and an ambient declaration only
// reaches the program that includes it.
/// <reference path="../../react-native-fast-crypto.d.ts" />
import type { ScryptParams } from "@shared/password-verifier";
import { scrypt } from "react-native-fast-crypto";
// React Native has no Buffer global; the package brings its own rather than lean on the app's.
import { Buffer } from "buffer";

export const APP_LOCK_SCRYPT_PARAMS: ScryptParams = {
  cost: 16384,
  blockSize: 8,
  parallelization: 1,
  digestLength: 32,
};

function encodePassword(password: string): Uint8Array {
  return new Uint8Array(Buffer.from(password, "utf8"));
}

export async function derivePasswordDigest(
  password: string,
  salt: Uint8Array,
  params: ScryptParams = APP_LOCK_SCRYPT_PARAMS,
): Promise<Uint8Array> {
  const digest = await scrypt(
    encodePassword(password),
    salt,
    params.cost,
    params.blockSize,
    params.parallelization,
    params.digestLength,
  );

  if (digest.length !== params.digestLength) {
    throw new Error(
      `app lock: scrypt returned ${digest.length} bytes, expected ${params.digestLength}`,
    );
  }

  return digest;
}

let derivations: Promise<unknown> = Promise.resolve();

export function serialiseDerivation<T>(run: () => Promise<T>): Promise<T> {
  const next = derivations.then(run, run);
  derivations = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}
