import type { PasswordVerifier, ScryptParams } from "@shared/password-verifier";
import * as Keychain from "react-native-keychain";
// React Native has no Buffer global; the package brings its own rather than lean on the app's.
import { Buffer } from "buffer";

const SERVICE = "com.ledger.live.appLock.passwordVerifier";
const USERNAME = "app-lock";

const writeOptions: Keychain.SetOptions = {
  service: SERVICE,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

type SerialisedVerifier = Readonly<{
  version: number;
  scrypt: ScryptParams;
  salt: string;
  digest: string;
  needsLongerPassword?: boolean;
}>;

/** The verifier and what is known about the password behind it, in one record. */
export type StoredPassword = Readonly<{
  verifier: PasswordVerifier;
  needsLongerPassword: boolean;
}>;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64"));
}

export function serialisePasswordVerifier(stored: StoredPassword): string {
  const serialised: SerialisedVerifier = {
    version: stored.verifier.version,
    scrypt: stored.verifier.scrypt,
    salt: toBase64(stored.verifier.salt),
    digest: toBase64(stored.verifier.digest),
    needsLongerPassword: stored.needsLongerPassword,
  };

  return JSON.stringify(serialised);
}

function toScryptParams(value: unknown): ScryptParams | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const { cost, blockSize, parallelization, digestLength } = value as Record<string, unknown>;
  const params = { cost, blockSize, parallelization, digestLength };

  return Object.values(params).every(
    number => typeof number === "number" && Number.isInteger(number) && number > 0,
  )
    ? (params as ScryptParams)
    : null;
}

export function deserialisePasswordVerifier(raw: string): StoredPassword | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const { version, scrypt, salt, digest, needsLongerPassword } =
      parsed as Partial<SerialisedVerifier>;
    const params = toScryptParams(scrypt);

    if (
      typeof version !== "number" ||
      !Number.isInteger(version) ||
      typeof salt !== "string" ||
      typeof digest !== "string" ||
      params === null
    ) {
      return null;
    }

    const digestBytes = fromBase64(digest);

    // A digest of another length can never match, so it is unreadable rather than wrong.
    if (digestBytes.length !== params.digestLength) {
      return null;
    }

    return {
      verifier: { version, scrypt: params, salt: fromBase64(salt), digest: digestBytes },
      // Unset is a record from before the mark existed; the next password unlock corrects it.
      needsLongerPassword: needsLongerPassword === true,
    };
  } catch {
    return null;
  }
}

export async function writePasswordVerifier(stored: StoredPassword): Promise<void> {
  const written = await Keychain.setGenericPassword(
    USERNAME,
    serialisePasswordVerifier(stored),
    writeOptions,
  );

  // Both platforms reject a refusal today, but the typed API allows one, and a password the
  // keychain never took must not be reported as set: the old verifier still opens the app.
  if (!written) {
    throw new Error("app lock: the keychain refused to store the password verifier");
  }
}

export async function readStoredPassword(): Promise<StoredPassword | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });

  return credentials ? deserialisePasswordVerifier(credentials.password) : null;
}

export async function clearPasswordVerifier(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}

// Existence only: an unparsable record still means the user has a password.
export async function hasStoredVerifier(): Promise<boolean> {
  return (await Keychain.getGenericPassword({ service: SERVICE })) !== false;
}
