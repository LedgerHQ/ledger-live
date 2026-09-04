import { readFile, writeFile } from "node:fs/promises";
import invariant from "invariant";
import { activateLedgerSync } from "../speculos";
import { ledgerKeyRingProtocol, ledgerSync, restoreTrustchain } from "./cli";
import { cloudSyncApiBaseUrl, trustchainApiBaseUrl } from "./environment";
import type { LedgerSyncAccountDescriptor } from "./testData";

interface LedgerKeyRingProtocolArgs {
  pubKey: string;
  privateKey: string;
  apiBaseUrl: string;
}

interface LedgerSyncPushDataArgs {
  rootId: string;
  walletSyncEncryptionKey: string;
  applicationPath: string;
  push: boolean;
  data: string;
  cloudSyncApiBaseUrl: string;
}

interface LedgerSyncPullDataArgs {
  pubKey: string;
  privateKey: string;
  rootId: string;
  walletSyncEncryptionKey: string;
  applicationPath: string;
  push: boolean;
  pull: boolean;
  data: string;
  cloudSyncApiBaseUrl: string;
}

interface LedgerOutput {
  pubkey?: string;
  privatekey?: string;
  rootId?: string;
  walletSyncEncryptionKey?: string;
  applicationPath?: string;
}

function isLedgerOutput(output: unknown): output is LedgerOutput {
  return typeof output === "object" && output !== null;
}

export class LedgerSyncCliHelper {
  static readonly ledgerKeyRingProtocolArgs: LedgerKeyRingProtocolArgs = {
    pubKey: "",
    privateKey: "",
    apiBaseUrl: trustchainApiBaseUrl,
  };

  static readonly ledgerSyncPushDataArgs: LedgerSyncPushDataArgs = {
    rootId: "",
    walletSyncEncryptionKey: "",
    applicationPath: "",
    push: true,
    data: JSON.stringify({ accounts: [], accountNames: {} }),
    cloudSyncApiBaseUrl,
  };

  /**
   * The member the trustchain was created with — the CLI. `addTrustchainMember` replaces the
   * working credentials with the new member's, and the app is then seeded with those, so this is
   * the only handle a test has on the *other* instance. Removing the seeded one is refused by the
   * app: "You can't remove this phone while you're using it".
   */
  static readonly initialMember = { pubKey: "" };

  static readonly ledgerSyncPullDataArgs: LedgerSyncPullDataArgs = {
    pubKey: "",
    privateKey: "",
    rootId: "",
    walletSyncEncryptionKey: "",
    applicationPath: "",
    push: false,
    pull: true,
    data: "",
    cloudSyncApiBaseUrl,
  };

  private static updateKeysAndArgs(output: unknown) {
    if (!isLedgerOutput(output)) return;
    LedgerSyncCliHelper.updateKeyRingCredentials(output);
    LedgerSyncCliHelper.updateSyncArgs(output);
  }

  private static updateKeyRingCredentials(output: LedgerOutput) {
    if ("pubkey" in output) {
      LedgerSyncCliHelper.ledgerKeyRingProtocolArgs.pubKey = output.pubkey ?? "";
      LedgerSyncCliHelper.ledgerKeyRingProtocolArgs.privateKey = output.privatekey ?? "";
      LedgerSyncCliHelper.ledgerSyncPullDataArgs.pubKey = output.pubkey ?? "";
      LedgerSyncCliHelper.ledgerSyncPullDataArgs.privateKey = output.privatekey ?? "";
    }
  }

  private static updateSyncArgs(output: LedgerOutput) {
    if ("rootId" in output) {
      Object.assign(LedgerSyncCliHelper.ledgerSyncPushDataArgs, {
        rootId: output.rootId,
        walletSyncEncryptionKey: output.walletSyncEncryptionKey,
        applicationPath: output.applicationPath,
      });

      Object.assign(LedgerSyncCliHelper.ledgerSyncPullDataArgs, {
        rootId: output.rootId,
        walletSyncEncryptionKey: output.walletSyncEncryptionKey,
        applicationPath: output.applicationPath,
      });
    }
  }

  static async initializeLedgerKeyRingProtocol() {
    return ledgerKeyRingProtocol({ initMemberCredentials: true }).then(output => {
      LedgerSyncCliHelper.updateKeysAndArgs(output);
      return output;
    });
  }

  static async initializeLedgerSync() {
    const output = ledgerKeyRingProtocol({
      getKeyRingTree: true,
      ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
    }).then(out => {
      LedgerSyncCliHelper.updateKeysAndArgs(out);
      return out;
    });
    await activateLedgerSync();
    return output;
  }

  /**
   * Adds a second member to the existing trustchain under its own instance name, so the app can be
   * seeded with it and still see the CLI as a separate instance. Takes an argument, so it cannot be
   * used as a `cliCommands` entry directly — wrap it in a no-arg command.
   */
  static async addTrustchainMember(name: string) {
    LedgerSyncCliHelper.initialMember.pubKey = LedgerSyncCliHelper.ledgerKeyRingProtocolArgs.pubKey;
    await LedgerSyncCliHelper.initializeLedgerKeyRingProtocol();

    const output = ledgerKeyRingProtocol({
      getKeyRingTree: true,
      name,
      ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
    }).then(out => {
      LedgerSyncCliHelper.updateKeysAndArgs(out);
      return out;
    });
    await activateLedgerSync();
    return output;
  }

  static async pushAccountsToTrustchain(
    descriptors: LedgerSyncAccountDescriptor[],
    accountNames: Record<string, string> = {},
  ) {
    LedgerSyncCliHelper.ledgerSyncPushDataArgs.data = JSON.stringify({
      accounts: descriptors,
      accountNames,
    });
    return LedgerSyncCliHelper.pushLedgerSyncData();
  }

  /**
   * Empty credentials reach the signer as a zero-length key and surface as noble's
   * `invalid private key: expected ui8a of size 32, got object`, which says nothing about the
   * real cause. Fail on the actual problem instead: the trustchain was never initialized.
   */
  private static assertInitialized(operation: string) {
    const { pubKey, privateKey } = LedgerSyncCliHelper.ledgerKeyRingProtocolArgs;
    const { rootId } = LedgerSyncCliHelper.ledgerSyncPushDataArgs;
    invariant(
      pubKey && privateKey && rootId,
      `Ledger Sync: cannot ${operation} before the trustchain is initialized ` +
        `(pubKey: ${pubKey.length} chars, privateKey: ${privateKey.length} chars, rootId: "${rootId}")`,
    );
  }

  static async pullLedgerSyncData() {
    LedgerSyncCliHelper.assertInitialized("pull");
    // Keyring args last: the pull args carry their own copy of the credentials, and only the
    // keyring ones are guaranteed to have been refreshed by initializeLedgerKeyRingProtocol.
    return ledgerSync({
      ...LedgerSyncCliHelper.ledgerSyncPullDataArgs,
      ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
    });
  }

  static async pushLedgerSyncData() {
    LedgerSyncCliHelper.assertInitialized("push");
    return ledgerSync({
      ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
      ...LedgerSyncCliHelper.ledgerSyncPushDataArgs,
    });
  }

  /**
   * Re-reads the trustchain from the backend. Removing a member rotates it onto the next
   * application path and re-derives the encryption key from that path, leaving both values captured
   * at creation time stale; without this a later delete is rejected with `TrustchainOutdated`.
   * Best effort: on failure the cached values are kept so the caller still gets the real error.
   */
  static async refreshTrustchain() {
    try {
      const { walletSyncEncryptionKey, applicationPath } = await restoreTrustchain({
        ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
        ...LedgerSyncCliHelper.ledgerSyncPushDataArgs,
      });
      Object.assign(LedgerSyncCliHelper.ledgerSyncPushDataArgs, {
        walletSyncEncryptionKey,
        applicationPath,
      });
      Object.assign(LedgerSyncCliHelper.ledgerSyncPullDataArgs, {
        walletSyncEncryptionKey,
        applicationPath,
      });
    } catch {
      // keep the cached values: the caller surfaces the real failure
    }
  }

  /**
   * Destroying the trustchain is what stops a run leaking one onto the backend, so it has to happen
   * even when there is no cloud-sync data to delete — which is the normal case for a suite that
   * never pushed any.
   *
   * When both legs fail the destroy error is the one thrown: it is the one that means a trustchain
   * was left behind, and `destroyTrustchain` goes quiet on the delete error's usual
   * `CloudSyncHttpError`, which would hide the leak. The delete error is logged rather than
   * dropped, since it explains what started the failure.
   */
  static async deleteLedgerSyncData() {
    await LedgerSyncCliHelper.refreshTrustchain();

    let deleteError: unknown;
    try {
      await ledgerSync({
        deleteData: true,
        ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
        ...LedgerSyncCliHelper.ledgerSyncPushDataArgs,
      });
    } catch (error) {
      deleteError = error;
    }

    try {
      await ledgerKeyRingProtocol({
        destroyKeyRingTree: true,
        ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
        ...LedgerSyncCliHelper.ledgerSyncPushDataArgs,
      });
    } catch (error) {
      if (deleteError !== undefined) {
        console.error("[E2E] Ledger Sync: the cloud-sync delete failed too:", deleteError);
      }
      throw error;
    }

    if (deleteError !== undefined) throw deleteError;
  }

  /**
   * Writes the CLI's trustchain and member credentials into the userdata `app.json` so the app
   * boots already synced, skipping the in-app activation flow. `data.trustchain` is allowlisted
   * and hydrated at startup by `fetchTrustchain`; the app reuses the CLI's member identity, so
   * the trustchain still holds a single member.
   */
  static async saveTrustchainToUserdata(userdataPath?: string) {
    invariant(userdataPath, "Ledger Sync: a userdata path is required to seed the trustchain");

    const { pubKey, privateKey } = LedgerSyncCliHelper.ledgerKeyRingProtocolArgs;
    const { rootId, walletSyncEncryptionKey, applicationPath } =
      LedgerSyncCliHelper.ledgerSyncPushDataArgs;
    invariant(
      pubKey && privateKey && rootId,
      "Ledger Sync: the trustchain must be initialized before seeding the userdata",
    );

    const userdata = JSON.parse(await readFile(userdataPath, "utf-8"));
    userdata.data = {
      ...userdata.data,
      trustchain: {
        trustchain: { rootId, walletSyncEncryptionKey, applicationPath },
        memberCredentials: { pubkey: pubKey, privatekey: privateKey },
      },
    };
    await writeFile(userdataPath, JSON.stringify(userdata));

    return { rootId };
  }
}
