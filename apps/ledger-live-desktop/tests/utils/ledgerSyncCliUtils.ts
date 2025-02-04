import { CLI } from "tests/utils/cliUtils";
import { activateLedgerSync } from "@ledgerhq/live-common/e2e/speculos";
import { accountNames, accounts } from "tests/testdata/ledgerSyncTestData";
import { Page } from "@playwright/test";

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
    if (!output || typeof output === "string") return;

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
      const parsedData = typeof pulledData === "string" ? JSON.parse(pulledData) : pulledData;
      return parsedData;
    } catch (error) {
      throw new Error(`Failed to parse pulledData: ${error}`);
    }
  }
  static queryBackEnd(page: Page) {
    const queryResponse = new Promise(resolve => {
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
    return queryResponse;
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

  static async pullDataFromCLI(pulledData: string | object) {
    try {
      return typeof pulledData === "string" ? JSON.parse(pulledData) : pulledData;
    } catch (error) {
      console.error("Failed to parse pulled data:", pulledData, error);
      throw new Error("Invalid JSON string in pulledData");
    }
  }
}
