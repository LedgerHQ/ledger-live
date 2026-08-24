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
  needsLongerPassword?: boolean;
}>;

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

export function serialiseStoredPassword({ verifier, needsLongerPassword }: StoredPassword): string {
  const serialised: SerialisedVerifier = {
    version: verifier.version,
    scrypt: verifier.scrypt,
    salt: toBase64(verifier.salt),
    digest: toBase64(verifier.digest),
    needsLongerPassword,
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

export function deserialiseStoredPassword(raw: string): StoredPassword | null {
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
      typeof salt !== "string" ||
      typeof digest !== "string" ||
      params === null
    ) {
      return null;
    }

    return {
      verifier: { version, scrypt: params, salt: fromBase64(salt), digest: fromBase64(digest) },
      needsLongerPassword: needsLongerPassword === true,
    };
  } catch {
    return null;
  }
}

export async function writePasswordVerifier(
  verifier: PasswordVerifier,
  { needsLongerPassword = false }: Readonly<{ needsLongerPassword?: boolean }> = {},
): Promise<void> {
  await Keychain.setGenericPassword(
    USERNAME,
    serialiseStoredPassword({ verifier, needsLongerPassword }),
    writeOptions,
  );
}

export async function hasPasswordVerifier(): Promise<boolean> {
  return Keychain.hasGenericPassword({ service: SERVICE });
}

export async function readStoredPassword(): Promise<StoredPassword | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });

  return credentials ? deserialiseStoredPassword(credentials.password) : null;
}

export async function readPasswordVerifier(): Promise<PasswordVerifier | null> {
  return (await readStoredPassword())?.verifier ?? null;
}

export async function clearPasswordVerifier(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
