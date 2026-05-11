import { CLI } from "tests/utils/cliUtils";
import { activateLedgerSync } from "@ledgerhq/live-common/e2e/speculos";
import { accountNames, accounts } from "tests/testdata/ledgerSyncTestData";
import { expect, Page, Response } from "@playwright/test";
import { Application } from "tests/page";
import { getEnv } from "@ledgerhq/live-env";

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
  private static environment = process.env.LEDGER_SYNC_ENVIRONMENT;

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
    data: JSON.stringify({
      accounts,
      accountNames,
    }),
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

  static getCloudSyncResponse(page: Page): Promise<Response> {
    return page.waitForResponse(
      response =>
        response.url().startsWith(LedgerSyncCliHelper.cloudSyncApiBaseUrl + "/atomic/v1/live") &&
        response.status() === 200,
      { timeout: 60_000 },
    );
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

  static async deleteLedgerSyncData() {
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

  static async checkSynchronizationSuccess(
    cloudSyncResponse: Promise<Response>,
    app: Application,
  ): Promise<void> {
    await app.layout.waitForAccountsSyncToBeDone();
    const response = await cloudSyncResponse;
    expect(response.ok(), "Cloud Sync response should complete").toBe(true);
  }
}
