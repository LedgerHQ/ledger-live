import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import {
  CASPER_FEES_MOTES,
  CASPER_MINIMUM_VALID_AMOUNT_MOTES,
} from "@ledgerhq/coin-casper/constants";
import type { CasperAccount, Transaction } from "@ledgerhq/coin-casper/types";
import { deriveUser } from "../casperDevnet";
import {
  GENESIS_USER_BALANCE_MOTES,
  LARGE_TRANSFER_ID,
  liveDerivationPath,
  makeAccount,
  RECIPIENT_USER_INDEX,
  SENDER_USER_INDEX,
  TRANSFER_AMOUNT_MOTES,
  TRANSFER_ID,
} from "../fixtures";
import { getBridges, syncAccount } from "../helpers";
import { indexTransfer, startIndexer } from "../indexer";

const feesMotes = new BigNumber(CASPER_FEES_MOTES);
const minimumValidAmountMotes = new BigNumber(CASPER_MINIMUM_VALID_AMOUNT_MOTES);

// `afterAll` only receives the scenario account, so these are held module-scope.
let bridge: AccountBridge<Transaction, CasperAccount>;
let recipientAccount: CasperAccount;
let recipientBalanceBefore: BigNumber;
let recipientPublicKey: string;
let senderAccountHash: string;
let recipientAccountHash: string;
let closeIndexer: () => void;

async function retryAssert(assert: () => Promise<void>, retriesLeft = 20): Promise<void> {
  try {
    await assert();
  } catch (error) {
    if (retriesLeft === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, 3 * 1000));
    await retryAssert(assert, retriesLeft - 1);
  }
}

type CasperOperation = CasperAccount["operations"][number];

// Asserted before indexing so a still-settling chain retries instead of throwing a
// TypeError on an empty operations array.
function newestOperation(
  previousAccount: CasperAccount,
  currentAccount: CasperAccount,
): CasperOperation {
  expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
  return currentAccount.operations[0];
}

function expectFixedSend(
  previousAccount: CasperAccount,
  currentAccount: CasperAccount,
  amount: BigNumber,
): CasperOperation {
  const operation = newestOperation(previousAccount, currentAccount);

  expect(operation.type).toBe("OUT");
  expect(operation.value.toFixed()).toBe(amount.plus(feesMotes).toFixed());
  expect(operation.fee.toFixed()).toBe(feesMotes.toFixed());
  expect(operation.senders).toEqual([senderAccountHash]);
  expect(operation.recipients).toEqual([recipientAccountHash]);
  expect(operation.hasFailed).toBe(false);
  expect(currentAccount.balance.toFixed()).toBe(
    previousAccount.balance.minus(operation.value).toFixed(),
  );

  return operation;
}

const transferTransaction = (): ScenarioTransaction<Transaction, CasperAccount> => ({
  name: "Send 10 CSPR",
  recipient: recipientPublicKey,
  amount: TRANSFER_AMOUNT_MOTES,
  transferId: TRANSFER_ID,
  expect: (previousAccount, currentAccount) => {
    const operation = expectFixedSend(previousAccount, currentAccount, TRANSFER_AMOUNT_MOTES);
    expect(operation.extra).toMatchObject({ transferId: TRANSFER_ID });
  },
});

const transferWithoutIdTransaction = (): ScenarioTransaction<Transaction, CasperAccount> => ({
  name: "Send 10 CSPR with no transfer id",
  recipient: recipientPublicKey,
  amount: TRANSFER_AMOUNT_MOTES,
  expect: (previousAccount, currentAccount) => {
    const operation = expectFixedSend(previousAccount, currentAccount, TRANSFER_AMOUNT_MOTES);
    // No id argument in the signed bytes, so buildOptimisticOperation leaves it unset.
    expect((operation.extra as { transferId?: string }).transferId).toBeUndefined();
  },
});

const minimumAmountTransaction = (): ScenarioTransaction<Transaction, CasperAccount> => ({
  name: "Send exactly the minimum valid amount",
  recipient: recipientPublicKey,
  amount: minimumValidAmountMotes,
  expect: (previousAccount, currentAccount) => {
    expectFixedSend(previousAccount, currentAccount, minimumValidAmountMotes);
  },
});

const largeTransferIdTransaction = (): ScenarioTransaction<Transaction, CasperAccount> => ({
  name: "Send 10 CSPR with a large transfer id",
  recipient: recipientPublicKey,
  amount: TRANSFER_AMOUNT_MOTES,
  transferId: LARGE_TRANSFER_ID,
  expect: (previousAccount, currentAccount) => {
    const operation = expectFixedSend(previousAccount, currentAccount, TRANSFER_AMOUNT_MOTES);
    expect(operation.extra).toMatchObject({ transferId: LARGE_TRANSFER_ID });
  },
});

const sendMaxTransaction = (): ScenarioTransaction<Transaction, CasperAccount> => ({
  name: "Send max",
  recipient: recipientPublicKey,
  useAllAmount: true,
  expect: (previousAccount, currentAccount) => {
    const operation = newestOperation(previousAccount, currentAccount);

    expect(operation.type).toBe("OUT");
    expect(operation.hasFailed).toBe(false);
    expect(operation.fee.toFixed()).toBe(feesMotes.toFixed());

    // prepareTransaction's spendableBalance − fees and buildOptimisticOperation's
    // fee-added-back-in must cancel out to the whole previous balance.
    expect(operation.value.toFixed()).toBe(previousAccount.spendableBalance.toFixed());

    // Holds only if the chain's real gas cost equals CASPER_FEES_MOTES to the mote.
    expect(currentAccount.balance.toFixed()).toBe("0");
  },
});

export const scenarioCasper: Scenario<Transaction, CasperAccount> = {
  name: "Casper devnet transfer",

  setup: async () => {
    closeIndexer = startIndexer();

    const sender = await deriveUser(SENDER_USER_INDEX);
    const recipient = await deriveUser(RECIPIENT_USER_INDEX);
    senderAccountHash = sender.accountHash;
    recipientAccountHash = recipient.accountHash;
    recipientPublicKey = recipient.publicKey;

    const { accountBridge, currencyBridge } = getBridges({
      [liveDerivationPath(SENDER_USER_INDEX)]: sender.secretKey,
      [liveDerivationPath(RECIPIENT_USER_INDEX)]: recipient.secretKey,
    });

    const account = makeAccount({ publicKey: sender.publicKey, index: SENDER_USER_INDEX });

    bridge = accountBridge;
    recipientAccount = await syncAccount(
      accountBridge,
      makeAccount({ publicKey: recipient.publicKey, index: RECIPIENT_USER_INDEX }),
    );
    recipientBalanceBefore = recipientAccount.balance;

    return { accountBridge, currencyBridge, account, retryLimit: 20 };
  },

  getTransactions: () => [
    transferTransaction(),
    transferWithoutIdTransaction(),
    minimumAmountTransaction(),
    largeTransferIdTransaction(),
    sendMaxTransaction(),
  ],

  mockIndexer: async (_account, optimistic) => {
    await indexTransfer(optimistic.hash);
  },

  afterAll: async account => {
    const outOps = account.operations.filter(op => op.type === "OUT");
    expect(outOps).toHaveLength(5);
    expect(account.balance.toFixed()).toBe("0");

    await retryAssert(async () => {
      const recipient = await syncAccount(bridge, recipientAccount);
      const inOps = recipient.operations.filter(op => op.type === "IN");

      expect(inOps).toHaveLength(5);
      expect(inOps.map(op => op.hash).sort()).toEqual(outOps.map(op => op.hash).sort());

      inOps.forEach(operation => {
        const out = outOps.find(o => o.hash === operation.hash)!;
        // mapTxToOps adds the fee only on the OUT side.
        expect(operation.value.toFixed()).toBe(out.value.minus(feesMotes).toFixed());
        // Pins current behaviour: the recipient pays nothing, yet mapTxToOps
        // copies the fee onto the IN operation too.
        expect(operation.fee.toFixed()).toBe(feesMotes.toFixed());
        expect(operation.senders).toEqual([senderAccountHash]);
        expect(operation.recipients).toEqual([recipientAccountHash]);
        expect(operation.hasFailed).toBe(false);
      });

      // Sender drains to 0 across five fees, so this holds without knowing the
      // send-max amount up front.
      expect(recipient.balance.minus(recipientBalanceBefore).toFixed()).toBe(
        GENESIS_USER_BALANCE_MOTES.minus(feesMotes.times(5)).toFixed(),
      );
    });
  },

  teardown: async () => {
    closeIndexer?.();
  },
};
