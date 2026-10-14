import { setupServer } from "msw/node";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import type { ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { createBridges } from "@ledgerhq/coin-aleo/bridge/index";
import type {
  AleoAccount,
  AleoCoinConfig,
  AleoSigner,
  Transaction as AleoTransaction,
} from "@ledgerhq/coin-aleo/types";
import { advanceBlocks } from "./devnode";
import { buildAleoCoinConfig, type GeneratedAleoAccount } from "./fixtures";
import { buildAleoHandlers, buildScannerHandlers } from "./msw/handlers";
import type { ExpectedTransfer } from "./msw/prove";
import { createRecordStore, makeRecordResolver, type RecordStore } from "./msw/records";
import { createFakeScanner } from "./msw/scanner";
import { buildMockAleoSigner } from "./signer";
import { startMockServer, syncAccount } from "./testSetup";

function getBridges(signer: AleoSigner, config: AleoCoinConfig) {
  const signerContext: SignerContext<AleoSigner> = (_, fn) => fn(signer);
  return createBridges(signerContext, () => config);
}

// The funding IN can share an OUT's date, so diff against the previous sync instead of taking the newest op.
export function newOperations<A extends Account>(previous: A, current: A): A["operations"] {
  const previousIds = new Set(previous.operations.map(op => op.id));
  return current.operations.filter(op => !previousIds.has(op.id));
}

/** A scenario transaction next to what its prove request must sign, so the two cannot drift apart. */
export type AleoStep = {
  transaction: ScenarioTransaction<AleoTransaction, AleoAccount>;
  signs: () => Pick<ExpectedTransfer, "recipient" | "amount">;
};

/** The MSW server, signer and bridges every scenario needs; the docker stack belongs to scenarii.test.ts. */
export function createAleoHarness() {
  const mockServer = setupServer();
  let accountBridge: AccountBridge<AleoTransaction, AleoAccount>;
  let senderPrivateKey: string;
  let recordStore: RecordStore | undefined;
  let pendingSteps: AleoStep[] = [];
  let expected: ExpectedTransfer | undefined;

  return {
    /** `scanned` turns on the private side: a record store for the sender and a scanner for each account. */
    async setup({
      sender,
      account,
      steps,
      scanned = [],
    }: {
      sender: GeneratedAleoAccount;
      account: AleoAccount;
      steps: AleoStep[];
      scanned?: GeneratedAleoAccount[];
    }) {
      const handlers = buildAleoHandlers(() => {
        if (!expected) {
          throw new Error("aleo coin-tester: a prove request arrived outside a scenario step");
        }
        return expected;
      });

      if (scanned.length > 0) {
        recordStore = createRecordStore(sender);
        await recordStore.refresh();

        const scanner = createFakeScanner();
        await scanner.setup();
        scanned.forEach(scanner.registerAccount);
        handlers.push(...buildScannerHandlers(scanner));
      }

      startMockServer(mockServer);
      mockServer.use(...handlers);
      senderPrivateKey = sender.privateKey;
      pendingSteps = [...steps];

      const resolveRecord = recordStore && makeRecordResolver(recordStore);
      const signer = buildMockAleoSigner(sender.privateKey, resolveRecord);
      const bridges = getBridges(signer, buildAleoCoinConfig());
      accountBridge = bridges.accountBridge;

      return {
        currencyBridge: bridges.currencyBridge,
        accountBridge,
        account,
        retryInterval: 1000,
        retryLimit: 20,
      };
    },

    // A devnode has no consensus, so every sync attempt must seal its own block.
    async beforeSync() {
      await advanceBlocks(1);
      await recordStore?.refresh();
    },

    beforeEach() {
      const step = pendingSteps.shift();
      if (!step) {
        throw new Error("aleo coin-tester: a transaction ran with no step queued for it");
      }
      expected = { ...step.signs(), senderPrivateKey, privateRecordStore: recordStore };
    },

    /** The harness only syncs the sender, so a recipient's IN side is synced by hand. */
    sync(account: AleoAccount) {
      return syncAccount(accountBridge, account);
    },

    teardown() {
      mockServer.close();
      recordStore = undefined;
      expected = undefined;
    },
  };
}
