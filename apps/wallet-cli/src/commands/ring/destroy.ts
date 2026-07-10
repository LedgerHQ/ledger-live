import { defineCommand } from "@bunli/core";
import { createInterface } from "node:readline";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { TrustchainEjected } from "@ledgerhq/ledger-key-ring-protocol/errors";
import type { Spinner } from "yocto-spinner";
import { Session, trustchainFromMeta, type TrustchainMeta } from "../../session/session-store";
import {
  loadMemberCredentials,
  deletePrivateKey,
  hasStoredKey,
  PasswordRequiredError,
  CorruptKeychainError,
} from "../../key-ring/keychain";
import { createLkrpSdk } from "../../key-ring/lkrp-sdk";
import { deriveWrappingKey } from "../../key-ring/crypto";
import { promptHidden } from "../../key-ring/prompt";
import { outputOption, resolveOutputFormat } from "../inputs";
import { createCommandOutput, type CommandOutput } from "../../output";
import {
  trackRingDestroyStarted,
  trackRingDestroyCompleted,
  trackRingDestroyCancelled,
} from "../../analytics/ring-analytics";

async function confirmDestroy(): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const answer = await new Promise<string>(resolve => {
    rl.question('Type "destroy" to confirm: ', ans => {
      rl.close();
      resolve(ans.trim());
    });
  });
  return answer === "destroy";
}

const errMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

// "ok": proceed with remote teardown. "abort": stop, change nothing — used whenever a password was
// expected but unusable, since local-wiping there would orphan the remote trustchain. "local-wipe":
// skip the remote teardown (a deliberate skip, or no credentials to authenticate with anyway).
type DestroyCredentials =
  | { status: "ok"; memberCredentials: MemberCredentials }
  | { status: "abort"; message: string }
  | { status: "local-wipe"; message: string };

// Either a usable wrapping key (undefined for a password-less ring) or an early destroy outcome the
// caller must return verbatim (a skip or an abort decided while resolving the password).
type WrappingKeyResolution =
  | { key: CryptoKey | undefined }
  | { early: Exclude<DestroyCredentials, { status: "ok" }> };

async function resolveDestroyWrappingKey(session: Session): Promise<WrappingKeyResolution> {
  if (!session.passwordSalt) return { key: undefined };

  let password: string;
  let source: "env" | "tty";
  try {
    ({ value: password, source } = await promptHidden("Password (Enter to skip remote destroy): "));
  } catch (e) {
    // Ctrl-C, or non-TTY without WALLET_PASS: no password read at all — not a deliberate skip,
    // so abort rather than orphan the ring with a local-only wipe.
    return { early: { status: "abort", message: errMessage(e) } };
  }
  if (!password) {
    // An empty value typed at the tty is a deliberate skip; an empty WALLET_PASS (e.g. a failed
    // `$(security …)` substitution) is a mistake, so abort to avoid orphaning the ring.
    if (source === "env")
      return { early: { status: "abort", message: "WALLET_PASS is set but empty." } };
    return { early: { status: "local-wipe", message: "No password provided" } };
  }
  try {
    return { key: await deriveWrappingKey(password, session.passwordSalt) };
  } catch (e) {
    // Malformed salt (PBKDF2 never rejects a well-formed one). The user intended a full destroy,
    // so surface it rather than downgrading to a local-only wipe.
    return { early: { status: "abort", message: errMessage(e) } };
  }
}

async function loadDestroyCredentials(session: Session): Promise<DestroyCredentials> {
  const resolved = await resolveDestroyWrappingKey(session);
  if ("early" in resolved) return resolved.early;
  const wrappingKey = resolved.key;

  try {
    const memberCredentials = await loadMemberCredentials(wrappingKey);
    if (!memberCredentials) {
      return { status: "local-wipe", message: "No credentials found in keychain" };
    }
    return { status: "ok", memberCredentials };
  } catch (e) {
    const message = errMessage(e);
    // A corrupt entry can't authenticate the remote, so aborting would only block recovery — local-wipe
    // it (the path `ring init` points here for). Abort only while the ring is still remotely
    // authenticatable: PasswordRequiredError (protected key, no usable wrapping key) or a wrapping key
    // that failed to decrypt (wrong password) — local-wiping either would orphan a live ring.
    if (e instanceof CorruptKeychainError) return { status: "local-wipe", message };
    if (e instanceof PasswordRequiredError || wrappingKey) return { status: "abort", message };
    return { status: "local-wipe", message };
  }
}

async function performRemoteDestroy(
  trustchainMeta: TrustchainMeta,
  memberCredentials: MemberCredentials,
  destroySpin: Spinner | null,
): Promise<{
  remoteSucceeded: boolean;
  trustchainDestroyed: boolean;
  memberEjected: boolean;
}> {
  const sdk = createLkrpSdk();
  try {
    // destroyApplication resolves the trustchain itself (no encryption key, no separate
    // restoreTrustchain round-trip), closes only the wallet-cli stream (or the whole trustchain when
    // it's the last open app), and is idempotent on an already-closed stream (returns without throwing).
    const { trustchainDestroyed } = await sdk.destroyApplication(
      trustchainFromMeta(trustchainMeta),
      memberCredentials,
    );
    // Stop without a message: out.ringDestroy() below is the single source of the outcome line.
    destroySpin?.stop();
    return { remoteSucceeded: true, trustchainDestroyed, memberEjected: false };
  } catch (e) {
    if (e instanceof TrustchainEjected) {
      // destroyApplication is idempotent on an already-closed stream (returns without throwing), so
      // TrustchainEjected means this member is no longer on the ring: it was removed by another
      // owner, or the trustchain was destroyed remotely. Either way there's nothing left for us to
      // tear down, so proceed to the local wipe rather than aborting as a transient failure
      // (retrying would never succeed).
      destroySpin?.stop();
      return { remoteSucceeded: true, trustchainDestroyed: false, memberEjected: true };
    }
    // No local wipe here: the handler aborts on a failed teardown (keeping the key). See below.
    destroySpin?.error("Remote teardown failed");
    return { remoteSucceeded: false, trustchainDestroyed: false, memberEjected: false };
  }
}

// No trustchain but a stray keychain key (e.g. after `session reset` on a corrupt file): no remote
// to authenticate, so local-wipe — the recovery path `ring init` points here for.
async function destroyStrayKey(session: Session, out: CommandOutput): Promise<void> {
  if (!hasStoredKey()) {
    throw new Error("Nothing to destroy — Ledger Key Ring is not initialized.");
  }
  if (!(await confirmDestroy())) {
    trackRingDestroyCancelled();
    out.ringDestroyCancelled();
    return;
  }
  trackRingDestroyStarted({ passwordProtected: false });
  const localWiped = deletePrivateKey();
  if (localWiped) {
    session.wipeRing();
    session.write();
  }
  out.ringDestroy({ remoteSucceeded: false, trustchainDestroyed: false, localWiped });
  trackRingDestroyCompleted({
    remoteSucceeded: false,
    trustchainDestroyed: false,
    localWiped,
    recoveryWipe: true,
  });
}

export default defineCommand({
  name: "destroy",
  description: "Tear down your Ledger Key Ring on LKRP and wipe local member credentials.",
  options: {
    output: outputOption,
  },
  handler: async ({ flags }) => {
    const out = createCommandOutput(resolveOutputFormat(flags.output), {
      command: "ring destroy",
      network: "all",
    });
    await out.run(async () => {
      const session = await Session.read();
      const trustchainMeta = session.trustchain;
      if (!trustchainMeta) {
        await destroyStrayKey(session, out);
        return;
      }

      const confirmed = await confirmDestroy();
      if (!confirmed) {
        trackRingDestroyCancelled();
        out.ringDestroyCancelled();
        return;
      }
      trackRingDestroyStarted({ passwordProtected: !!session.passwordSalt });

      const creds = await loadDestroyCredentials(session);
      if (creds.status === "abort") {
        // Abort before touching anything: wiping now would orphan the remote trustchain, whose only
        // auth key this is. Only a password-protected ring shows a prompt, so tailor the hint: the
        // "press Enter to skip" escape hatch doesn't exist for a password-less ring.
        const hint = session.passwordSalt
          ? " Re-run with the correct password (inject WALLET_PASS from your OS keychain), or press " +
            "Enter at the password prompt to skip the remote teardown and wipe locally."
          : " The stored credential is password-protected but this session has no password metadata " +
            "to unlock it; restore the original session file to retry the remote teardown.";
        throw new Error(`${creds.message} Aborting — no changes made.${hint}`);
      }

      let remoteSucceeded = false;
      let trustchainDestroyed = false;
      let memberEjected = false;

      if (creds.status === "ok") {
        const destroySpin = out.spin("Tearing down your Ledger Key Ring…");
        ({ remoteSucceeded, trustchainDestroyed, memberEjected } = await performRemoteDestroy(
          trustchainMeta,
          creds.memberCredentials,
          destroySpin,
        ));
      } else {
        // Non-interactive out.spin prints the label to stderr and returns null (so .error() no-ops):
        // the reason must live in the label itself, not a bogus "Tearing down…" for a local-only wipe.
        const reason = `${creds.message} — continuing with local wipe.`;
        out.spin(reason)?.error(reason);
      }

      // A failed teardown with valid creds is likely transient (offline / 5xx), so keep the key
      // rather than orphan a possibly-still-live ring. Escape hatch: re-run and press Enter at the
      // prompt to skip. (A password-less ring has no interactive skip.)
      if (creds.status === "ok" && !remoteSucceeded) {
        // The "press Enter to skip" hint only applies to a password-protected ring (the sole flow
        // that prompts); a password-less ring has no interactive skip, so omit it.
        const skipHint = session.passwordSalt
          ? " or re-run and press Enter at the password prompt to skip the remote teardown and wipe " +
            "locally"
          : "";
        throw new Error(
          "Remote teardown failed (network/backend). No local changes made — retry when " +
            `connectivity is restored${skipHint}.`,
        );
      }

      const localWiped = deletePrivateKey();
      // Clear the session pointer only once the key is actually gone; if its removal failed, keep the
      // metadata so the user can re-run destroy (a stale pointer is harmless by comparison).
      if (localWiped) {
        session.wipeRing();
        session.write();
      }
      out.ringDestroy({ remoteSucceeded, trustchainDestroyed, localWiped, memberEjected });
      trackRingDestroyCompleted({
        remoteSucceeded,
        trustchainDestroyed,
        localWiped,
        recoveryWipe: false,
      });
    });
  },
});
