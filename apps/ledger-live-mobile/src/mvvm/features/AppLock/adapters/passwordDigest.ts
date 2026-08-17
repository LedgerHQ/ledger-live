import type { ScryptParams } from "@shared/password-verifier";
import { scrypt } from "react-native-fast-crypto";

// Set here, not in @shared/password-verifier, because the right cost depends on the slowest device.
// TODO(LIVE-35505): measure on a low-end Android before release; raising it later is safe, since
// every verifier carries the parameters it was created with.
export const APP_LOCK_SCRYPT_PARAMS: ScryptParams = {
  cost: 16384,
  blockSize: 8,
  parallelization: 1,
  digestLength: 32,
};

export const APP_LOCK_SALT_LENGTH = 16;

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

let queue: Promise<unknown> = Promise.resolve();
let depth = 0;

// One at a time, so concurrent setups cannot store a verifier whose salt belongs to the other run.
// Re-entrant on purpose: queueing a nested call behind the outer run awaiting it would hang the
// module-level queue for good.
export function serialiseDerivation<T>(run: () => Promise<T>): Promise<T> {
  if (depth > 0) {
    return run();
  }

  const next = queue.then(async () => {
    depth += 1;

    try {
      return await run();
    } finally {
      depth -= 1;
    }
  });

  queue = next.then(
    () => undefined,
    () => undefined,
  );

  return next;
}
