import { chmodSync, existsSync, mkdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { stateDir } from "@bunli/utils";
import { APP_NAME } from "../session/session-store";
import { writeSecureFile } from "../shared/secure-file";
import { writeStderr } from "../shared/ui";

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

export function loadAgentIntentKeyFile(profileId: string): string | null {
  const path = agentIntentKeyFilePath(profileId);
  try {
    const secretKey = readFileSync(path, "utf8").trim();
    // Like ssh's "permissions are too open", but only a warning: the human already chose plaintext.
    const mode = statSync(path).mode & 0o777;
    if (mode & 0o077) {
      writeStderr(
        `⚠ Permissions ${mode.toString(8)} for ${path} are too open: run \`chmod 600 ${path}\`.\n`,
      );
    }
    return secretKey;
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") return null;
    throw e;
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
