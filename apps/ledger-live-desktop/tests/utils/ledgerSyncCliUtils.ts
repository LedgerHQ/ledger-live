import { CLI, CLI as CLIType } from "tests/utils/cliUtils";
import { activateLedgerSync } from "@ledgerhq/live-common/e2e/speculos";
import { accountNames, accounts } from "tests/testdata/ledgerSyncTestData";

export class LedgerSyncCliHelper {
  static ledgerKeyRingProtocolArgs = {
    pubKey: "",
    privateKey: "",
  };

  static ledgerSyncPushDataArgs = {
    rootId: "",
    walletSyncEncryptionKey: "",
    applicationPath: "",
    push: true,
    data: JSON.stringify({
      accounts,
      accountNames,
    }),
  };

  static ledgerSyncPullDataArgs = {
    pubKey: "",
    privateKey: "",
    rootId: "",
    walletSyncEncryptionKey: "",
    applicationPath: "",
    push: false,
    pull: true,
    data: "",
  };

  private static updateKeysAndArgs(output: any) {
    if (output && typeof output !== "string") {
      if ("pubkey" in output) {
        LedgerSyncCliHelper.ledgerKeyRingProtocolArgs.pubKey = output.pubkey;
        LedgerSyncCliHelper.ledgerKeyRingProtocolArgs.privateKey = output.privatekey;
        LedgerSyncCliHelper.ledgerSyncPullDataArgs.pubKey = output.pubkey;
        LedgerSyncCliHelper.ledgerSyncPullDataArgs.privateKey = output.privatekey;
      }
      if ("rootId" in output) {
        LedgerSyncCliHelper.ledgerSyncPushDataArgs.rootId = output.rootId;
        LedgerSyncCliHelper.ledgerSyncPushDataArgs.walletSyncEncryptionKey =
          output.walletSyncEncryptionKey;
        LedgerSyncCliHelper.ledgerSyncPushDataArgs.applicationPath = output.applicationPath;
        LedgerSyncCliHelper.ledgerSyncPullDataArgs.rootId = output.rootId;
        LedgerSyncCliHelper.ledgerSyncPullDataArgs.walletSyncEncryptionKey =
          output.walletSyncEncryptionKey;
        LedgerSyncCliHelper.ledgerSyncPullDataArgs.applicationPath = output.applicationPath;
      }
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
}
