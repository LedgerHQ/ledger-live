import { CLI } from "tests/utils/cliUtils";
import { activateLedgerSync } from "@ledgerhq/live-common/e2e/speculos";
import { accountNames, accounts } from "tests/testdata/ledgerSyncTestData";
import { expect, Page, Response } from "@playwright/test";
import { Application } from "tests/page";
import { getEnv } from "@ledgerhq/live-env";
import invariant from "invariant";
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

interface LedgerSyncAccountData {
  id?: string;
  currencyId?: string;
  index?: number;
}

interface LedgerSyncPulledData {
  updateEvent?: {
    data?: {
      accounts?: LedgerSyncAccountData[];
      accountNames?: Record<string, string>;
    };
  };
}

interface ExpectedSyncedAccountData {
  deletedAccountId: string;
  remainingAccountId: string;
  expectedRemainingAccountName: string;
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

  static parseData(pulledData: string | void): LedgerSyncPulledData {
    invariant(pulledData, "Ledger Sync: pulledData is undefined");
    try {
      const parsedData: LedgerSyncPulledData = JSON.parse(pulledData);
      return parsedData;
    } catch (error) {
      throw new Error(`Failed to parse pulledData: ${error}`);
    }
  }

  static getCloudSyncResponse(page: Page): Promise<Response> {
    return page.waitForResponse(
      response =>
        response.url().startsWith(LedgerSyncCliHelper.cloudSyncApiBaseUrl + "/atomic/v1/live") &&
        response.status() === 200,
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

  static async checkSynchronizationSuccess(page: Page, app: Application): Promise<Response> {
    const cloudSyncResponse = LedgerSyncCliHelper.getCloudSyncResponse(page);
    await app.layout.waitForAccountsSyncToBeDone();
    return cloudSyncResponse;
  }

  private static findSyncedAccount(
    parsedData: LedgerSyncPulledData,
    accountId: string,
  ): LedgerSyncAccountData | undefined {
    return parsedData.updateEvent?.data?.accounts?.find(account => account.id === accountId);
  }

  private static getSyncedAccountIds(parsedData: LedgerSyncPulledData): string[] {
    return (
      parsedData.updateEvent?.data?.accounts
        ?.map(account => account.id)
        .filter((accountId): accountId is string => Boolean(accountId)) ?? []
    );
  }

  private static getSyncedAccountName(
    parsedData: LedgerSyncPulledData,
    accountId: string,
  ): string | undefined {
    return parsedData.updateEvent?.data?.accountNames?.[accountId];
  }

  private static isAccountDeleted(parsedData: LedgerSyncPulledData, accountId: string): boolean {
    return !LedgerSyncCliHelper.findSyncedAccount(parsedData, accountId);
  }

  private static isAccountRenamedCorrectly(
    parsedData: LedgerSyncPulledData,
    accountId: string,
    expectedName: string,
  ): boolean {
    return LedgerSyncCliHelper.getSyncedAccountName(parsedData, accountId) === expectedName;
  }

  static expectPulledDataToMatchAccountChanges(
    pulledData: string | void,
    {
      deletedAccountId,
      remainingAccountId,
      expectedRemainingAccountName,
    }: ExpectedSyncedAccountData,
  ) {
    const parsedData = LedgerSyncCliHelper.parseData(pulledData);

    expect(
      LedgerSyncCliHelper.getSyncedAccountIds(parsedData),
      "Backend data should only contain the remaining account",
    ).toEqual([remainingAccountId]);
    expect(
      LedgerSyncCliHelper.isAccountDeleted(parsedData, deletedAccountId),
      "Deleted account should not be present in backend accounts",
    ).toBe(true);
    expect(
      LedgerSyncCliHelper.getSyncedAccountName(parsedData, remainingAccountId),
      "Backend account name should match the renamed account",
    ).toBe(expectedRemainingAccountName);
    expect(
      LedgerSyncCliHelper.isAccountRenamedCorrectly(
        parsedData,
        remainingAccountId,
        expectedRemainingAccountName,
      ),
      "Account should be renamed correctly",
    ).toBe(true);
  }
}
