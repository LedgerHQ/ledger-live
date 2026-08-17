import type { PasswordVerifier, ScryptParams } from "@shared/password-verifier";
import * as Keychain from "react-native-keychain";

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
}>;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64"));
}

export function serialisePasswordVerifier(verifier: PasswordVerifier): string {
  const serialised: SerialisedVerifier = {
    version: verifier.version,
    scrypt: verifier.scrypt,
    salt: toBase64(verifier.salt),
    digest: toBase64(verifier.digest),
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

export function deserialisePasswordVerifier(raw: string): PasswordVerifier | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const { version, scrypt, salt, digest } = parsed as Partial<SerialisedVerifier>;
    const params = toScryptParams(scrypt);

    if (
      typeof version !== "number" ||
      typeof salt !== "string" ||
      typeof digest !== "string" ||
      params === null
    ) {
      return null;
    }

    return { version, scrypt: params, salt: fromBase64(salt), digest: fromBase64(digest) };
  } catch {
    return null;
  }
}

export async function writePasswordVerifier(verifier: PasswordVerifier): Promise<void> {
  await Keychain.setGenericPassword(USERNAME, serialisePasswordVerifier(verifier), writeOptions);
}

export async function readPasswordVerifier(): Promise<PasswordVerifier | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });

  return credentials ? deserialisePasswordVerifier(credentials.password) : null;
}

export async function clearPasswordVerifier(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
