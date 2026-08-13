import { CLI } from "tests/utils/cliUtils";
import { activateLedgerSync } from "@ledgerhq/live-e2e-shared/speculos";
import { getEnv } from "@shared/env";
import { readFile, writeFile } from "node:fs/promises";
import invariant from "invariant";

/** An account as it is stored in the trustchain, matching `accountDescriptorSchema`. */
export interface LedgerSyncAccountDescriptor {
  id: string;
  currencyId: string;
  index: number;
  seedIdentifier: string;
  derivationMode: string;
  freshAddress: string;
}

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

export const ledgerSyncEnvironment =
  process.env.LEDGER_SYNC_ENVIRONMENT === "PROD" ? "PROD" : "STAGING";

export class LedgerSyncCliHelper {
  private static environment = ledgerSyncEnvironment;

  private static cloudSyncApiBaseUrl =
    LedgerSyncCliHelper.environment == "PROD"
      ? getEnv("CLOUD_SYNC_API_PROD")
      : getEnv("CLOUD_SYNC_API_STAGING");

  private static apiBaseUrl =
    LedgerSyncCliHelper.environment == "PROD"
      ? getEnv("TRUSTCHAIN_API_PROD")
      : getEnv("TRUSTCHAIN_API_STAGING");

  static ledgerKeyRingProtocolArgs: LedgerKeyRingProtocolArgs = {
    pubKey: "",
    privateKey: "",
    apiBaseUrl: LedgerSyncCliHelper.apiBaseUrl,
  };

  static ledgerSyncPushDataArgs: LedgerSyncPushDataArgs = {
    rootId: "",
    walletSyncEncryptionKey: "",
    applicationPath: "",
    push: true,
    data: JSON.stringify({ accounts: [], accountNames: {} }),
    cloudSyncApiBaseUrl: LedgerSyncCliHelper.cloudSyncApiBaseUrl,
  };

  static ledgerSyncPullDataArgs: LedgerSyncPullDataArgs = {
    pubKey: "",
    privateKey: "",
    rootId: "",
    walletSyncEncryptionKey: "",
    applicationPath: "",
    push: false,
    pull: true,
    data: "",
    cloudSyncApiBaseUrl: LedgerSyncCliHelper.cloudSyncApiBaseUrl,
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
    return CLI.ledgerKeyRingProtocol({ initMemberCredentials: true }).then(output => {
      LedgerSyncCliHelper.updateKeysAndArgs(output);
      return output;
    });
  }

  static async initializeLedgerSync() {
    const output = CLI.ledgerKeyRingProtocol({
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
    await LedgerSyncCliHelper.initializeLedgerKeyRingProtocol();

    const output = CLI.ledgerKeyRingProtocol({
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

  static async pullLedgerSyncData() {
    return CLI.ledgerSync({
      ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
      ...LedgerSyncCliHelper.ledgerSyncPullDataArgs,
    });
  }

  static async pushLedgerSyncData() {
    return CLI.ledgerSync({
      ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
      ...LedgerSyncCliHelper.ledgerSyncPushDataArgs,
    });
  }

  /**
   * Re-reads the application path from the backend. Removing a member rotates the trustchain onto
   * the next application path, leaving the path captured at creation time stale; without this a
   * later delete is rejected with `TrustchainOutdated`. Best effort: on failure the cached path is
   * kept so the caller still gets the underlying error.
   */
  static async refreshApplicationPath() {
    try {
      const applicationPath = await CLI.resolveApplicationPath({
        ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
        ...LedgerSyncCliHelper.ledgerSyncPushDataArgs,
      });
      if (applicationPath) {
        LedgerSyncCliHelper.ledgerSyncPushDataArgs.applicationPath = applicationPath;
        LedgerSyncCliHelper.ledgerSyncPullDataArgs.applicationPath = applicationPath;
      }
    } catch {
      // keep the cached path: the caller surfaces the real failure
    }
  }

  static async deleteLedgerSyncData() {
    await LedgerSyncCliHelper.refreshApplicationPath();

    await CLI.ledgerSync({
      deleteData: true,
      ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
      ...LedgerSyncCliHelper.ledgerSyncPushDataArgs,
    });

    await CLI.ledgerKeyRingProtocol({
      destroyKeyRingTree: true,
      ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
      ...LedgerSyncCliHelper.ledgerSyncPushDataArgs,
    });
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
