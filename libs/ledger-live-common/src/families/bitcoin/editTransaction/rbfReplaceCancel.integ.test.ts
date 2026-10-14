/**
 * Integration tests for Bitcoin RBF (Replace-By-Fee) cancel and speedup on the generic bridge
 * stack: the edit transaction helpers, the UTXO account module (change address, own addresses,
 * replacement intent) and coin-bitcoin's primitives and fee estimation, against an explorer
 * serving fixture transactions (no network). Only the coin module resolution is mocked.
 *
 * Covers:
 * - Speed up / cancel of a pending send: recipient, amount, rate, change, excluded pending change.
 * - The edit flow: editable transaction of the pending operation → patch → validation.
 * - The replacement intent spends the replaced inputs again and pays the minimum replacement fee.
 * - Cancel the already canceled (works like speed up), with or without a known recipient.
 * - Speed up then cancel.
 * - After cancel confirmed: the replaced transaction leaves the history and the pending list.
 * - Receiver: canceled (replaced) tx removed; unconfirmed can stay until 2 hours.
 * - Single UTXO and multiple UTXO account fixtures.
 */
import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { REPLACE_CANCEL, REPLACE_SPEEDUP, type BitcoinTxData } from "@ledgerhq/coin-bitcoin/api";
import { estimateFees } from "@ledgerhq/coin-bitcoin/logic/estimateFees";
import { getTransaction } from "@ledgerhq/coin-bitcoin/logic/getTransaction";
import { deriveAddress } from "@ledgerhq/coin-bitcoin/logic/derivation";
import { emptyState, versioned, type UtxoCoinModuleApi } from "@ledgerhq/account-module-utxo";
import {
  buildRbfFixtureTxs,
  buildRbfFixtureTxsWithTwoUtxos,
  type RbfFixtureResult,
} from "@ledgerhq/coin-bitcoin/fixtures/rbf.fixtures";
import { removeReplaced } from "@ledgerhq/wallet-btc/operations";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { accountModulePostSync } from "../../../bridge/generic-coin-framework/accountModule";
import { cryptoFor } from "../accountModule/derivation";
import { bitcoinAccountModuleBinding, computeIntentType } from "../accountModule";
import { bitcoinAccountData } from "../accountModule/account";
import { accountOptions } from "../accountModule/intent";
import { bitcoinAccountModule } from "../accountModule/module";

// the pending operations rule of the generic bridge for an account-module family
const postSync = (_initial: BitcoinAccount, synced: BitcoinAccount) =>
  accountModulePostSync(bitcoinAccountModuleBinding, synced);
import { fromTransactionRaw } from "../transaction";
import {
  bitcoinPickingStrategy,
  type BitcoinAccount,
  type BitcoinOutput,
  type BtcOperation,
  type Transaction as BtcTransaction,
  type TransactionRaw,
} from "../types";
import { buildRbfCancelTx, buildRbfSpeedUpTx } from "./buildRbfTransaction";
import { getEditableTransactionRaw } from "./editableTransaction";
import { getEditTransactionPatch } from "./getEditTransactionPatch";
import { getEditTransactionStatus } from "./getTransactionStatus";
import { hasMinimumFundsToCancel } from "./hasMinimumFunds";
import { getAdditionalFeeRequiredForRbf, getOriginalTxFeeRateSatVb } from "./rbfValidation";
import { getReplacementEstimate } from "./replacement";

// the replacement bump ratio: the module default (no `fees.rbfMinBumpRatio` in the config)
jest.mock("../coinConfig", () => ({ getBitcoinCoinConfig: jest.fn(() => ({})) }));
jest.mock("../../../bridge/generic-coin-framework/api", () => ({
  getCoinModuleApi: jest.fn(),
}));

jest.setTimeout(30000);

// Legacy (44'/0'/0') account: its addresses are derived, the fixture funds its first change address.
const XPUB =
  "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz";
const ACCOUNT_ID = `js:2:bitcoin:${XPUB}:`;
const EXTERNAL_RECIPIENT = "1BKWjmA9swxRKMH9NgXpSz8YZfVMnWWU9D";
const AMOUNT_TO_EXTERNAL = 50000;
const CHANGE_AMOUNT = 40000;
const FUNDING_OUTPUT_VALUE = 100000;

const crypto = cryptoFor("bitcoin");
const address = (chain: number, index: number) => crypto.getAddress("Legacy", XPUB, chain, index);

type TxHexMap = Record<string, string>;
type Intent = TransactionIntent<any, BitcoinTxData>;

let explorerCount = 0;

/** The explorer calls a replacement estimation makes; presets 20/10/5 sat/vB, 1 sat/vB relay. */
function createMockExplorer(txHexMap: TxHexMap) {
  return {
    // estimations cache rates and transactions per explorer
    baseUrl: `fake://rbf-integ-${++explorerCount}`,
    getTxHex: jest.fn((txId: string): Promise<string> => {
      const hex = txHexMap[txId];
      if (hex) return Promise.resolve(hex);
      return Promise.reject(new Error(`Unknown tx id: ${txId}`));
    }),
    getFees: jest.fn(() =>
      Promise.resolve({ "1": 20000, "3": 10000, "6": 5000, last_updated: Date.now() }),
    ),
    getNetwork: jest.fn(() =>
      Promise.resolve({ relay_fee: "0.00001000", incremental_fee: "0.00001000" }),
    ),
  };
}

type MockExplorer = ReturnType<typeof createMockExplorer>;

/** The local coin module, its primitives and estimation against the mock explorer. */
function serveCoinModule(explorer: MockExplorer) {
  const api = {
    estimateFees: jest.fn(
      (
        _context: unknown,
        intent: Intent,
        options?: { customFeesParameters?: Record<string, unknown> },
      ) => estimateFees(explorer as never, "bitcoin", intent, options?.customFeesParameters),
    ),
    getTransaction: (_context: unknown, txid: string) =>
      getTransaction(explorer as never, "bitcoin", txid),
    deriveAddress: (_context: unknown, request: Parameters<typeof deriveAddress>[1]) =>
      deriveAddress("bitcoin", request),
    craftTransactionData: () => ({ type: "bitcoin" }),
  };
  (getCoinModuleApi as jest.Mock).mockResolvedValue(api);
  return api;
}

/** The coin module's estimation of an intent the account module completed. */
const estimateCompleted = (
  explorer: MockExplorer,
  intent: Intent,
  parameters?: Record<string, unknown>,
) =>
  estimateFees(
    explorer as never,
    "bitcoin",
    intent as Parameters<typeof estimateFees>[2],
    parameters,
  );

type Addresses = { receive0: string; change0: string; change1: string };

async function deriveAddresses(): Promise<Addresses> {
  const [receive0, change0, change1] = await Promise.all([
    address(0, 0),
    address(1, 0),
    address(1, 1),
  ]);
  return { receive0, change0, change1 };
}

function pendingOperation({
  hash,
  recipients,
  value,
  inputs,
  transactionRaw,
}: {
  hash: string;
  recipients: string[];
  value: number;
  inputs: string[];
  transactionRaw?: TransactionRaw;
}): BtcOperation {
  return {
    id: `pending-${hash}`,
    hash,
    type: "OUT",
    value: new BigNumber(value),
    fee: new BigNumber(10000),
    senders: [],
    recipients,
    blockHeight: null,
    blockHash: null,
    accountId: ACCOUNT_ID,
    date: new Date(),
    extra: { inputs },
    ...(transactionRaw ? { transactionRaw } : {}),
  } as BtcOperation;
}

function createBitcoinAccount(
  addresses: Addresses,
  pendingOperations: BtcOperation[],
  utxos: BitcoinOutput[] = [],
): BitcoinAccount {
  return {
    type: "Account",
    id: ACCOUNT_ID,
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: addresses.receive0,
    freshAddressPath: "44'/0'/0'/0/0",
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 100_000,
    currency: getCryptoCurrencyById("bitcoin"),
    operationsCount: 0,
    operations: [],
    pendingOperations,
    lastSyncDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
    bitcoinResources: {
      utxos,
      accountState: versioned({
        ...emptyState(),
        syncedHeight: 100_000,
        addresses: [
          { address: addresses.receive0, chain: 0, index: 0 },
          { address: addresses.change0, chain: 1, index: 0 },
        ],
      }),
    },
  } as BitcoinAccount;
}

/** The intent the generic bridge builds for a transaction, before the account module completes it. */
const intentOf = (account: BitcoinAccount, transaction: BtcTransaction): Intent => {
  const { feePerByte } = transaction.familySpecificData ?? {};
  return {
    intentType: "transaction",
    type: computeIntentType(transaction as unknown as Record<string, unknown>),
    sender: account.freshAddress,
    recipient: transaction.recipient,
    amount: BigInt(transaction.amount.toFixed()),
    asset: { type: "native" },
    data: { type: "bitcoin", ...(feePerByte ? { feePerByte } : {}) },
  };
};

/** The intent the account module hands the coin module for a replacement transaction. */
const completeReplacement = async (
  account: BitcoinAccount,
  transaction: BtcTransaction,
  api: ReturnType<typeof serveCoinModule>,
): Promise<Intent> => {
  const module = bitcoinAccountModule(api as unknown as UtxoCoinModuleApi, "bitcoin");
  await module.estimateFees({} as never, bitcoinAccountData(account), {
    ...intentOf(account, transaction),
    accountOptions: accountOptions(transaction as unknown as Record<string, unknown>),
  });
  return api.estimateFees.mock.calls[api.estimateFees.mock.calls.length - 1][1];
};

const makeStatus = () => ({
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
});

describe("RBF replace and cancel integration (single UTXO)", () => {
  let addresses: Addresses;
  let fixture: RbfFixtureResult;
  let originalTxId: string;
  let fundingInput: string;
  let mockExplorer: MockExplorer;
  let api: ReturnType<typeof serveCoinModule>;
  let bitcoinAccount: BitcoinAccount;
  let pendingChange: BitcoinOutput;
  let originalSendRaw: TransactionRaw;

  beforeAll(async () => {
    addresses = await deriveAddresses();
    fixture = buildRbfFixtureTxs({
      externalRecipient: EXTERNAL_RECIPIENT,
      changeAddress: addresses.change0,
      amountToExternal: AMOUNT_TO_EXTERNAL,
      changeAmount: CHANGE_AMOUNT,
      fundingOutputValue: FUNDING_OUTPUT_VALUE,
    });
    originalTxId = fixture.originalTxId;
    fundingInput = `${fixture.fundingTxIdHex}-0`;
    mockExplorer = createMockExplorer({
      [fixture.fundingTxIdHex]: fixture.fundingTxHex,
      [fixture.originalTxId]: fixture.rbfTxHex,
      [fixture.speedupTxId]: fixture.speedupTxHex,
      [fixture.cancelTxId]: fixture.cancelTxHex,
    });

    // the change of the transaction to replace, still pending
    pendingChange = {
      hash: originalTxId,
      outputIndex: 1,
      blockHeight: null,
      address: addresses.change0,
      value: new BigNumber(CHANGE_AMOUNT),
      rbf: true,
      isChange: true,
    };
    originalSendRaw = {
      family: "bitcoin",
      amount: String(AMOUNT_TO_EXTERNAL),
      recipient: EXTERNAL_RECIPIENT,
      feesStrategy: "medium",
      familySpecificData: {
        rbf: true,
        utxoStrategy: { strategy: bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST, excludeUTXOs: [] },
      },
    };
    bitcoinAccount = createBitcoinAccount(
      addresses,
      [
        pendingOperation({
          hash: originalTxId,
          recipients: [EXTERNAL_RECIPIENT],
          value: AMOUNT_TO_EXTERNAL,
          inputs: [fundingInput],
          transactionRaw: originalSendRaw,
        }),
      ],
      [pendingChange],
    );
  });

  beforeEach(() => {
    api = serveCoinModule(mockExplorer);
  });

  it("estimates the replacement from the replaced transaction the network serves", async () => {
    const estimate = await getReplacementEstimate(bitcoinAccount, originalTxId);

    // 1 input, 2 outputs, unsigned: 119 vB; fee 100000 - 50000 - 40000 = 10000 → 85 sat/vB
    expect(estimate).toMatchObject({
      feeRates: { slow: 5n, medium: 10n, fast: 20n },
      originalFee: 10000n,
      originalFeePerByte: 85n,
      // BIP125 with a 10% bump (9 sat/vB): (85 + 9) × 119
      minReplacementFee: 11186n,
      minReplacementFeePerByte: 94n,
      replacedInputs: [
        {
          txid: fixture.fundingTxIdHex,
          vout: 0,
          value: BigInt(FUNDING_OUTPUT_VALUE),
          address: addresses.change0,
        },
      ],
      replacedOutputs: [
        { address: EXTERNAL_RECIPIENT, value: BigInt(AMOUNT_TO_EXTERNAL) },
        { address: addresses.change0, value: BigInt(CHANGE_AMOUNT) },
      ],
    });
    expect(getCoinModuleApi).toHaveBeenCalledWith("bitcoin", "local");
    expect(mockExplorer.getTxHex).toHaveBeenCalledWith(originalTxId);
    expect(mockExplorer.getTxHex).toHaveBeenCalledWith(fixture.fundingTxIdHex);
  });

  it("buildRbfSpeedUpTx returns a speedup transaction with same recipient and amount", async () => {
    const tx = await buildRbfSpeedUpTx(bitcoinAccount, originalTxId);

    expect(tx).toEqual({
      family: "bitcoin",
      mode: "send",
      recipient: EXTERNAL_RECIPIENT,
      amount: new BigNumber(AMOUNT_TO_EXTERNAL),
      useAllAmount: false,
      // the minimum replacement rate is above the network fast rate
      feesStrategy: "custom",
      familySpecificData: {
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
          // its own pending change can not fund the replacement
          excludeUTXOs: [{ hash: originalTxId, outputIndex: 1 }],
        },
        rbf: true,
        replaceTxId: originalTxId,
        changeAddress: addresses.change1,
        feePerByte: "94",
      },
    });
  });

  it("buildRbfCancelTx returns a cancel transaction sending to the next change address", async () => {
    const tx = await buildRbfCancelTx(bitcoinAccount, originalTxId);

    expect(tx.recipient).toBe(addresses.change1);
    expect(tx.familySpecificData?.changeAddress).toBe(addresses.change1);
    expect(tx.amount).toEqual(new BigNumber(AMOUNT_TO_EXTERNAL));
    expect(tx.familySpecificData).toMatchObject({
      replaceTxId: originalTxId,
      rbf: true,
      feePerByte: "94",
      utxoStrategy: { excludeUTXOs: [{ hash: originalTxId, outputIndex: 1 }] },
    });
  });

  it.each([
    ["speedup", REPLACE_SPEEDUP, EXTERNAL_RECIPIENT],
    ["cancel", REPLACE_CANCEL, "change1"],
  ] as const)(
    "getEditTransactionPatch(%s) from the pending operation's editable transaction",
    async (editType, intentType, recipient) => {
      const [operation] = bitcoinAccount.pendingOperations;
      const transaction = fromTransactionRaw(getEditableTransactionRaw(operation, bitcoinAccount));
      expect(transaction.familySpecificData?.replaceTxId).toBe(originalTxId);

      const patch = await getEditTransactionPatch({
        editType,
        transaction,
        account: bitcoinAccount,
      });

      const expectedRecipient = recipient === "change1" ? addresses.change1 : recipient;
      expect(patch.recipient).toBe(expectedRecipient);
      expect(patch.amount).toEqual(new BigNumber(AMOUNT_TO_EXTERNAL));
      expect(patch.familySpecificData).toMatchObject({
        replaceTxId: originalTxId,
        rbf: true,
        changeAddress: addresses.change1,
        feePerByte: "94",
      });
      expect(computeIntentType(patch as unknown as Record<string, unknown>)).toBe(intentType);
    },
  );

  it("speed up: the replacement intent spends the replaced inputs and pays the minimum replacement fee", async () => {
    const speedup = await buildRbfSpeedUpTx(bitcoinAccount, originalTxId);

    const intent = await completeReplacement(bitcoinAccount, speedup, api);

    expect(intent.type).toBe(REPLACE_SPEEDUP);
    expect(intent.data).toMatchObject({
      derivationMode: "",
      feePerByte: "94",
      change: { address: addresses.change1, path: "44'/0'/0'/1/1" },
      inputs: [
        {
          txid: fixture.fundingTxIdHex,
          vout: 0,
          address: addresses.change0,
          path: "44'/0'/0'/1/0",
          value: String(FUNDING_OUTPUT_VALUE),
        },
      ],
      replacement: { txid: originalTxId, conflictingTxIds: [] },
    });

    const { value } = await estimateCompleted(mockExplorer, intent);
    expect(value >= 11186n).toBe(true);
  });

  it("cancel: the replacement intent pays the account back from the replaced inputs", async () => {
    const cancel = await buildRbfCancelTx(bitcoinAccount, originalTxId);

    const intent = await completeReplacement(bitcoinAccount, cancel, api);

    expect(intent.type).toBe(REPLACE_CANCEL);
    expect(intent.recipient).toBe(addresses.change1);
    expect(intent.data?.inputs?.map(input => [input.txid, input.vout, input.path])).toEqual([
      [fixture.fundingTxIdHex, 0, "44'/0'/0'/1/0"],
    ]);
    const { value } = await estimateCompleted(mockExplorer, intent);
    expect(value >= 11186n).toBe(true);
  });

  it("validates the patch against the original rate the network reports", async () => {
    const [operation] = bitcoinAccount.pendingOperations;
    // the operation's transaction does not store the rate it was sent with
    const transactionToUpdate = fromTransactionRaw(
      getEditableTransactionRaw(operation, bitcoinAccount),
    );
    const originalFeePerByte = await getOriginalTxFeeRateSatVb(bitcoinAccount, originalTxId);
    expect(originalFeePerByte?.toNumber()).toBe(85);

    const patch = await getEditTransactionPatch({
      editType: "speedup",
      transaction: transactionToUpdate,
      account: bitcoinAccount,
    });
    const params = {
      mainAccount: bitcoinAccount,
      transactionToUpdate,
      status: makeStatus(),
      editType: "speedup" as const,
      originalFeePerByte,
    };

    expect(getEditTransactionStatus({ ...params, transaction: patch }).errors).toEqual({});
    // below 85 + 10%: underpriced
    const underpriced = {
      ...patch,
      familySpecificData: { ...patch.familySpecificData, feePerByte: "90" },
    };
    expect(getEditTransactionStatus({ ...params, transaction: underpriced }).errors).toHaveProperty(
      "replacementTransactionUnderpriced",
    );
  });

  it("requires the funds the replacement adds to the original fee", async () => {
    const transactionToUpdate = {
      familySpecificData: { replaceTxId: originalTxId },
    } as BtcTransaction;

    const additional = await getAdditionalFeeRequiredForRbf({
      mainAccount: bitcoinAccount,
      transactionToUpdate,
    });
    expect(additional.toNumber()).toBe(1186);

    await expect(
      hasMinimumFundsToCancel({
        mainAccount: { ...bitcoinAccount, spendableBalance: new BigNumber(1185) },
        transactionToUpdate,
      }),
    ).resolves.toBe(false);
    await expect(
      hasMinimumFundsToCancel({
        mainAccount: { ...bitcoinAccount, spendableBalance: new BigNumber(1186) },
        transactionToUpdate,
      }),
    ).resolves.toBe(true);
  });

  it("cancel the already canceled: build cancel for a pending cancel tx (works like speed up)", async () => {
    const cancelTxValue = FUNDING_OUTPUT_VALUE - 5000;
    const accountWithPendingCancel = createBitcoinAccount(addresses, [
      pendingOperation({
        hash: fixture.cancelTxId,
        recipients: [addresses.change0],
        value: cancelTxValue,
        inputs: [fundingInput],
      }),
    ]);

    const tx = await buildRbfCancelTx(accountWithPendingCancel, fixture.cancelTxId);

    expect(tx.family).toBe("bitcoin");
    expect(tx.recipient).toBe(addresses.change1);
    expect(tx.amount).toEqual(new BigNumber(cancelTxValue));
    // 1 input, 1 output: 85 vB at 59 sat/vB → (59 + 6) × 85 to replace
    expect(tx.feesStrategy).toBe("custom");
    expect(tx.familySpecificData).toMatchObject({
      replaceTxId: fixture.cancelTxId,
      rbf: true,
      changeAddress: addresses.change1,
      feePerByte: "65",
    });
  });

  it("cancel the already canceled with missing recipient still derives non-zero amount", async () => {
    const accountWithPendingCancel = createBitcoinAccount(addresses, [
      pendingOperation({
        hash: fixture.cancelTxId,
        recipients: [],
        value: 0,
        inputs: [fundingInput],
      }),
    ]);

    const tx = await buildRbfCancelTx(accountWithPendingCancel, fixture.cancelTxId);

    expect(tx.familySpecificData?.replaceTxId).toBe(fixture.cancelTxId);
    expect(tx.recipient).toBe(addresses.change1);
    expect(tx.amount).toEqual(new BigNumber(FUNDING_OUTPUT_VALUE - 5000));
  });

  it("speed up then cancel: build cancel for the speedup tx", async () => {
    const accountWithPendingSpeedup = createBitcoinAccount(addresses, [
      pendingOperation({
        hash: fixture.speedupTxId,
        recipients: [EXTERNAL_RECIPIENT],
        value: AMOUNT_TO_EXTERNAL,
        inputs: [fundingInput],
      }),
    ]);

    const tx = await buildRbfCancelTx(accountWithPendingSpeedup, fixture.speedupTxId);

    expect(tx.familySpecificData?.replaceTxId).toBe(fixture.speedupTxId);
    expect(tx.recipient).toBe(addresses.change1);
    expect(tx.amount).toEqual(new BigNumber(AMOUNT_TO_EXTERNAL));
  });

  it("send then cancel then cancel again: the cancel of the cancel conflicts with the send", async () => {
    const send = pendingOperation({
      hash: originalTxId,
      recipients: [EXTERNAL_RECIPIENT],
      value: AMOUNT_TO_EXTERNAL,
      inputs: [fundingInput],
    });
    const cancelPatch = await getEditTransactionPatch({
      editType: "cancel",
      transaction: fromTransactionRaw(
        getEditableTransactionRaw(send, createBitcoinAccount(addresses, [send])),
      ),
      account: createBitcoinAccount(addresses, [send]),
    });
    expect(cancelPatch.recipient).toBe(cancelPatch.familySpecificData?.changeAddress);

    const cancel = pendingOperation({
      hash: fixture.cancelTxId,
      recipients: [addresses.change0],
      value: FUNDING_OUTPUT_VALUE - 5000,
      inputs: [fundingInput],
    });
    const accountWithBoth = createBitcoinAccount(addresses, [send, cancel]);
    const cancelOfCancel = await getEditTransactionPatch({
      editType: "cancel",
      transaction: fromTransactionRaw(getEditableTransactionRaw(cancel, accountWithBoth)),
      account: accountWithBoth,
    });
    expect(cancelOfCancel.familySpecificData?.replaceTxId).toBe(fixture.cancelTxId);
    expect(cancelOfCancel.recipient).toBe(cancelOfCancel.familySpecificData?.changeAddress);

    const intent = await completeReplacement(accountWithBoth, cancelOfCancel, api);
    expect(intent.data?.replacement).toEqual({
      txid: fixture.cancelTxId,
      conflictingTxIds: [originalTxId],
    });
  });

  it("speeds up at the network fast rate when it already replaces the transaction", async () => {
    // fee 100000 - 50000 - 49800 = 200 → 2 sat/vB, replaced from 3 sat/vB: below the fast rate (20)
    const cheap = buildRbfFixtureTxs({
      externalRecipient: EXTERNAL_RECIPIENT,
      changeAddress: addresses.change0,
      amountToExternal: AMOUNT_TO_EXTERNAL,
      changeAmount: 49800,
      fundingOutputValue: FUNDING_OUTPUT_VALUE,
    });
    const cheapExplorer = createMockExplorer({
      [cheap.fundingTxIdHex]: cheap.fundingTxHex,
      [cheap.originalTxId]: cheap.rbfTxHex,
    });
    const cheapApi = serveCoinModule(cheapExplorer);
    const account = createBitcoinAccount(addresses, [
      pendingOperation({
        hash: cheap.originalTxId,
        recipients: [EXTERNAL_RECIPIENT],
        value: AMOUNT_TO_EXTERNAL,
        inputs: [`${cheap.fundingTxIdHex}-0`],
      }),
    ]);

    const tx = await buildRbfSpeedUpTx(account, cheap.originalTxId);

    expect(tx.feesStrategy).toBe("fast");
    expect(tx.familySpecificData).not.toHaveProperty("feePerByte");
    expect(tx.recipient).toBe(EXTERNAL_RECIPIENT);

    // once prepared, the transaction carries the fast rate it is estimated at
    const prepared = { ...tx, feeParameters: { feePerByte: "20" } };
    expect(
      getEditTransactionStatus({
        mainAccount: account,
        transaction: prepared,
        transactionToUpdate: {
          ...tx,
          familySpecificData: { rbf: true, replaceTxId: cheap.originalTxId },
        },
        status: makeStatus(),
        editType: "speedup",
        originalFeePerByte: await getOriginalTxFeeRateSatVb(account, cheap.originalTxId),
      }).errors,
    ).toEqual({});

    const intent = await completeReplacement(account, tx, cheapApi);
    const { value } = await estimateCompleted(cheapExplorer, intent, { feesStrategy: "fast" });
    expect(value >= 357n).toBe(true);
  });
});

describe("RBF replace and cancel integration (multiple UTXOs)", () => {
  const FUNDING1 = 60000;
  const FUNDING2 = 50000;
  const CHANGE_MULTI = 40000;

  let addresses: Addresses;
  let fixture: ReturnType<typeof buildRbfFixtureTxsWithTwoUtxos>;
  let mockExplorer: MockExplorer;
  let api: ReturnType<typeof serveCoinModule>;
  let bitcoinAccount: BitcoinAccount;

  beforeAll(async () => {
    addresses = await deriveAddresses();
    fixture = buildRbfFixtureTxsWithTwoUtxos({
      externalRecipient: EXTERNAL_RECIPIENT,
      changeAddress: addresses.change0,
      amountToExternal: AMOUNT_TO_EXTERNAL,
      changeAmount: CHANGE_MULTI,
      fundingOutputValue1: FUNDING1,
      fundingOutputValue2: FUNDING2,
    });
    mockExplorer = createMockExplorer({
      [fixture.fundingTx1IdHex]: fixture.fundingTx1Hex,
      [fixture.fundingTx2IdHex]: fixture.fundingTx2Hex,
      [fixture.originalTxId]: fixture.rbfTxHex,
    });
    bitcoinAccount = createBitcoinAccount(addresses, [
      pendingOperation({
        hash: fixture.originalTxId,
        recipients: [EXTERNAL_RECIPIENT],
        value: AMOUNT_TO_EXTERNAL,
        inputs: [`${fixture.fundingTx1IdHex}-0`, `${fixture.fundingTx2IdHex}-0`],
      }),
    ]);
  });

  beforeEach(() => {
    api = serveCoinModule(mockExplorer);
  });

  it("buildRbfCancelTx with multiple UTXOs returns cancel sending to change address", async () => {
    const tx = await buildRbfCancelTx(bitcoinAccount, fixture.originalTxId);

    expect(tx.family).toBe("bitcoin");
    expect(tx.recipient).toBe(addresses.change1);
    expect(tx.familySpecificData).toMatchObject({
      replaceTxId: fixture.originalTxId,
      rbf: true,
      changeAddress: addresses.change1,
    });
  });

  it("buildRbfSpeedUpTx with multiple UTXOs returns speedup with same recipient and amount", async () => {
    const tx = await buildRbfSpeedUpTx(bitcoinAccount, fixture.originalTxId);

    expect(tx.recipient).toBe(EXTERNAL_RECIPIENT);
    expect(tx.amount).toEqual(new BigNumber(AMOUNT_TO_EXTERNAL));
    // 2 inputs, 2 outputs: 160 vB, fee 20000 → 125 sat/vB; (125 + 13) × 160 to replace
    expect(tx.familySpecificData).toMatchObject({
      replaceTxId: fixture.originalTxId,
      feePerByte: "138",
    });
  });

  it("getEditTransactionPatch(cancel) with multiple UTXOs spends every replaced input again", async () => {
    const [operation] = bitcoinAccount.pendingOperations;
    const patch = await getEditTransactionPatch({
      editType: "cancel",
      transaction: fromTransactionRaw(getEditableTransactionRaw(operation, bitcoinAccount)),
      account: bitcoinAccount,
    });
    expect(patch.recipient).toBe(patch.familySpecificData?.changeAddress);

    const intent = await completeReplacement(bitcoinAccount, patch, api);

    expect(intent.data?.inputs?.map(input => [input.txid, input.vout, input.path])).toEqual([
      [fixture.fundingTx1IdHex, 0, "44'/0'/0'/1/0"],
      [fixture.fundingTx2IdHex, 0, "44'/0'/0'/1/0"],
    ]);
  });
});

describe("history after a replacement (cancel/speedup)", () => {
  const baseOp = {
    accountId: "test",
    type: "OUT" as const,
    fee: new BigNumber(1000),
    value: new BigNumber(50000),
    senders: [] as string[],
    recipients: [EXTERNAL_RECIPIENT],
    blockHash: null as string | null,
    hasFailed: false,
  };

  it("after cancel confirmed: old (unconfirmed) tx is not in history", () => {
    const inputA = "aa00000000000000000000000000000000000000000000000000000000000001";
    const unconfirmedSend: BtcOperation = {
      ...baseOp,
      id: "op-send",
      hash: "tx-unconfirmed-send",
      blockHeight: null,
      date: new Date("2024-06-01"),
      extra: { inputs: [inputA] },
    };
    const confirmedCancel: BtcOperation = {
      ...baseOp,
      id: "op-cancel",
      hash: "tx-confirmed-cancel",
      blockHeight: 100,
      date: new Date("2024-06-02"),
      extra: { inputs: [inputA] },
    };
    const result = removeReplaced([unconfirmedSend, confirmedCancel]);
    expect(result.map(o => o.hash)).toEqual(["tx-confirmed-cancel"]);
    expect(result).not.toContainEqual(expect.objectContaining({ hash: "tx-unconfirmed-send" }));
  });

  it("after cancel confirmed: the replaced send leaves the pending operations", () => {
    const inputA = "aa00000000000000000000000000000000000000000000000000000000000001-0";
    const inputOther = "dd00000000000000000000000000000000000000000000000000000000000004-0";
    const replacedSend: BtcOperation = {
      ...baseOp,
      id: "op-send",
      hash: "tx-pending-send",
      blockHeight: null,
      date: new Date("2024-06-01"),
      extra: { inputs: [inputA] },
    };
    const otherSend: BtcOperation = {
      ...replacedSend,
      id: "op-other-send",
      hash: "tx-pending-other",
      extra: { inputs: [inputOther] },
    };
    const confirmedCancel: BtcOperation = {
      ...baseOp,
      id: "op-cancel",
      hash: "tx-confirmed-cancel",
      blockHeight: 100,
      date: new Date("2024-06-02"),
      extra: { inputs: [inputA] },
    };
    const synced = {
      operations: [confirmedCancel],
      pendingOperations: [replacedSend, otherSend],
    } as unknown as BitcoinAccount;

    const result = postSync(synced, synced);

    expect(result.pendingOperations.map(o => o.hash)).toEqual(["tx-pending-other"]);
    expect(result.operations.map(o => o.hash)).toEqual(["tx-confirmed-cancel"]);
  });

  it("receiver: canceled (replaced) tx removed; unconfirmed stays until 2 hours", () => {
    const inputB = "bb00000000000000000000000000000000000000000000000000000000000002";
    const unconfirmedReceive: BtcOperation = {
      ...baseOp,
      type: "IN",
      id: "op-receive",
      hash: "tx-unconfirmed-receive",
      blockHeight: null,
      date: new Date("2024-06-01"),
      extra: { inputs: [inputB] },
    };
    const confirmedOther: BtcOperation = {
      ...baseOp,
      id: "op-other",
      hash: "tx-confirmed-other",
      blockHeight: 100,
      date: new Date("2024-06-02"),
      extra: { inputs: [inputB] },
    };
    const result = removeReplaced([unconfirmedReceive, confirmedOther]);
    expect(result.map(o => o.hash)).toEqual(["tx-confirmed-other"]);
  });

  it("unconfirmed tx stays in history until 2 hours then filtered out", () => {
    const inputC = "cc00000000000000000000000000000000000000000000000000000000000003";
    const unconfirmedOnly: BtcOperation = {
      ...baseOp,
      id: "op-only",
      hash: "tx-unconfirmed-only",
      blockHeight: null,
      date: new Date("2024-01-01T00:00:00Z"),
      extra: { inputs: [inputC] },
    };
    const beforeTwoHours = removeReplaced(
      [unconfirmedOnly],
      new Date("2024-01-01T01:00:00Z").getTime(),
    );
    expect(beforeTwoHours.map(o => o.hash)).toEqual(["tx-unconfirmed-only"]);
    const afterTwoHours = removeReplaced(
      [unconfirmedOnly],
      new Date("2024-01-01T04:00:00Z").getTime(),
    );
    expect(afterTwoHours).toEqual([]);
  });
});
