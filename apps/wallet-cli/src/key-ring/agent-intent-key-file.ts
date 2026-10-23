import {
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { stateDir } from "@bunli/utils";
import { APP_NAME } from "../session/session-store";
import { writeSecureFile } from "../shared/secure-file";

// Unencrypted fallback for an Agent Intent profile's secret key, used only on a host without a
// usable OS keychain and only after the human explicitly agreed
// (`agent-intent enroll --allow-plaintext-key`).
export const agentIntentKeyDir = (): string => join(stateDir(APP_NAME), "agent-intent-keys");

// The profile id regex allows no path separators, so the id is safe as a file name.
export function agentIntentKeyFilePath(profileId: string): string {
  return join(agentIntentKeyDir(), `${profileId}.key`);
}

export function saveAgentIntentKeyFile(profileId: string, secretKeyHex: string): void {
  const path = agentIntentKeyFilePath(profileId);
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700); // enforce on a dir that already existed with looser permissions
  writeSecureFile(path, Buffer.from(secretKeyHex));
}

// Like ssh with a private key: the human agreed to a 0600 file of their own, so anything else is
// refused before the key is read. Checked on the descriptor it is read from, never through a symlink.
export function loadAgentIntentKeyFile(profileId: string): string | null {
  const path = agentIntentKeyFilePath(profileId);
  let fd: number;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (e) {
    const code = e instanceof Error && "code" in e ? e.code : undefined;
    if (code === "ENOENT") return null;
    if (code === "ELOOP") {
      throw new Error(`${path} is a symlink, not the key file itself.`, { cause: e });
    }
    throw e;
  }
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile()) throw new Error(`${path} is not a regular file.`);
    if (stat.uid !== process.getuid?.()) {
      throw new Error(`${path} is not owned by the current user.`);
    }
    const mode = stat.mode & 0o777;
    if (mode & 0o077) {
      throw new Error(
        `Permissions ${mode.toString(8)} for ${path} are too open: run \`chmod 600 ${path}\`.`,
      );
    }
    return readFileSync(fd, "utf8").trim();
  } finally {
    closeSync(fd);
  }
}

// "Deleted" and "already absent" both satisfy the postcondition (no key remains).
export function deleteAgentIntentKeyFile(profileId: string): boolean {
  try {
    unlinkSync(agentIntentKeyFilePath(profileId));
    return true;
  } catch (e) {
    return e instanceof Error && "code" in e && e.code === "ENOENT";
  }
}

export const hasAgentIntentKeyFile = (profileId: string): boolean =>
  existsSync(agentIntentKeyFilePath(profileId));
