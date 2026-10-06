import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { AleoAccount, Transaction as AleoTransaction } from "@ledgerhq/coin-aleo/types";
import {
  ALEO,
  FUNDING_AMOUNT_MICROCREDITS,
  buildAleoCoinConfig,
  generateAleoAccount,
  makeAleoAccount,
  type GeneratedAleoAccount,
} from "../fixtures";
import { advanceBlocks, getPublicBalance } from "../devnode";
import { getBridges } from "../helpers";
import { buildAleoHandlers } from "../msw/handlers";
import { getSponsoredFee } from "../msw/sponsor";
import { buildMockAleoSigner } from "../signer";
import { fundFromGenesis, startMockServer, syncAccount } from "../testSetup";

const mockServer = setupServer();

let sender: GeneratedAleoAccount;
let recipient: GeneratedAleoAccount;
let accountBridge: AccountBridge<AleoTransaction, AleoAccount>;

const sendMaxPublic: ScenarioTransaction<AleoTransaction, AleoAccount> = {
  name: "Send max public microcredits from a funded sender to a fresh recipient",
  useAllAmount: true,
  get recipient() {
    return recipient.address;
  },
  expect: (previous, current) => {
    // The funding IN can share this OUT's date, so diff against the previous sync instead of taking the newest op.
    const newOperations = current.operations.filter(
      currentOp => !previous.operations.some(previousOp => previousOp.id === currentOp.id),
    );
    expect(newOperations).toHaveLength(1);
    const [latest] = newOperations;

    expect(latest.type).toBe("OUT");
    expect(latest.hasFailed).toBe(false);
    expect(latest.recipients).toStrictEqual([recipient.address]);
    expect(latest.senders).toStrictEqual([sender.address]);

    // Pins develop: the optimistic op had fee 0; aligning it is left to the fee-sponsoring epic.
    expect(latest.fee.toNumber()).toBe(getSponsoredFee(latest.hash));

    // The fee is sponsored, so send-max drains the whole balance.
    expect(latest.value).toStrictEqual(new BigNumber(FUNDING_AMOUNT_MICROCREDITS));
    expect(current.balance).toStrictEqual(new BigNumber(0));
    expect(current.pendingOperations).toStrictEqual([]);
  },
};

export const scenarioSendMaxPublic: Scenario<AleoTransaction, AleoAccount> = {
  name: "Ledger Live Aleo — public credit send-max",

  // Must not touch docker: spawnStack runs `compose down --volumes` and would kill the shared stack.
  setup: async () => {
    [sender, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

    startMockServer(mockServer);
    mockServer.use(
      ...buildAleoHandlers({
        recipient: recipient.address,
        amount: FUNDING_AMOUNT_MICROCREDITS,
        senderPrivateKey: sender.privateKey,
      }),
    );

    await fundFromGenesis(sender.address, FUNDING_AMOUNT_MICROCREDITS);

    const signer = buildMockAleoSigner(sender.privateKey);
    const bridges = getBridges(signer, buildAleoCoinConfig());
    accountBridge = bridges.accountBridge;

    return {
      currencyBridge: bridges.currencyBridge,
      accountBridge,
      account: makeAleoAccount(sender.address, sender.viewKey),
      retryInterval: 1000,
      retryLimit: 20,
    };
  },

  // A devnode has no consensus, so every sync attempt must seal its own block.
  beforeSync: async () => {
    await advanceBlocks(1);
  },

  getTransactions: () => [sendMaxPublic],

  beforeAll: account => {
    expect(account.currency.id).toBe(ALEO.id);
    expect(account.balance.toNumber()).toBe(FUNDING_AMOUNT_MICROCREDITS);
    expect(account.freshAddress).toBe(sender.address);
  },

  afterAll: async account => {
    const senderChainBalance = await getPublicBalance(sender.address);
    expect(senderChainBalance).toBe(BigInt(account.balance.toFixed(0)));
    expect(senderChainBalance).toBe(0n);
    expect(await getPublicBalance(recipient.address)).toBe(BigInt(FUNDING_AMOUNT_MICROCREDITS));

    // The harness only syncs `sender`, so the IN side is synced by hand.
    const recipientAccount = await syncAccount(
      accountBridge,
      makeAleoAccount(recipient.address, recipient.viewKey),
    );

    expect(recipientAccount.operations).toHaveLength(1);
    const [latest] = recipientAccount.operations;
    expect(latest.type).toBe("IN");
    expect(latest.hasFailed).toBe(false);
    expect(latest.senders).toStrictEqual([sender.address]);
    expect(latest.recipients).toStrictEqual([recipient.address]);
    expect(latest.value).toStrictEqual(new BigNumber(FUNDING_AMOUNT_MICROCREDITS));
    expect(recipientAccount.balance).toStrictEqual(new BigNumber(FUNDING_AMOUNT_MICROCREDITS));
  },

  // The docker stack belongs to scenarii.test.ts.
  teardown: () => {
    mockServer.close();
  },
};
