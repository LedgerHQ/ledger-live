import { CLI } from "./cliUtils";
import { activateLedgerSync } from "@ledgerhq/live-common/e2e/speculos";
import { accountNames, accounts } from "../testdata/ledgerSyncTestData";
import { Page } from "@playwright/test";
import { Application } from "../page";
import { DistantState as LiveData } from "@ledgerhq/live-wallet/walletsync/index";

interface LedgerKeyRingProtocolArgs {
  pubKey: string;
  privateKey: string;
}

interface LedgerSyncPushDataArgs {
  rootId: string;
  walletSyncEncryptionKey: string;
  applicationPath: string;
  push: boolean;
  data: string;
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
}

interface LedgerOutput {
  pubkey?: string;
  privatekey?: string;
  rootId?: string;
  walletSyncEncryptionKey?: string;
  applicationPath?: string;
}

export class LedgerSyncCliHelper {
  static ledgerKeyRingProtocolArgs: LedgerKeyRingProtocolArgs = {
    pubKey: "",
    privateKey: "",
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
  };

  private static updateKeysAndArgs(output: LedgerOutput) {
    if (!output) return;
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

  static parseData(pulledData: string) {
    try {
      return JSON.parse(pulledData);
    } catch (error) {
      throw new Error(`Failed to parse pulledData: ${error}`);
    }
  }

  static getCloudSyncResponse(page: Page) {
    return new Promise(resolve => {
      page.on("response", response => {
        if (
          response
            .url()
            .startsWith("https://cloud-sync-backend.api.aws.stg.ldg-tech.com/atomic/v1/live") &&
          response.status() === 200
        ) {
          resolve(response);
        }
      });
    });
  }

  static async initializeLedgerKeyRingProtocol() {
    return CLI.ledgerKeyRingProtocol({ initMemberCredentials: true }).then(output => {
      LedgerSyncCliHelper.updateKeysAndArgs(output as LedgerOutput);
      return output;
    });
  }

  static async initializeLedgerSync() {
    const output = CLI.ledgerKeyRingProtocol({
      getKeyRingTree: true,
      ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
    }).then(out => {
      LedgerSyncCliHelper.updateKeysAndArgs(out as LedgerOutput);
      return out;
    });
    await activateLedgerSync();
    return output;
  }

  static checkSynchronizationSuccess(page: Page, app: Application) {
    app.layout.waitForAccountsSyncToBeDone();
    return LedgerSyncCliHelper.getCloudSyncResponse(page);
  }

  static checkAccountDeletion(parsedData: any, accountId: string): any {
    return (parsedData.updateEvent.data as LiveData).accounts?.find(
      account => account.id === accountId,
    );
  }
}
