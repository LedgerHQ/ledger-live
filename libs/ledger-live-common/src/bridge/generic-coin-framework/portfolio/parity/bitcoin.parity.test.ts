import BigNumber from "bignumber.js";
import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import type { Account, Operation } from "@ledgerhq/types-live";
import {
  getEditTransactionPatch,
  getEditTransactionStatus,
  getOriginalTxFeeRateSatVb,
  hasMinimumFundsToCancel,
  hasMinimumFundsToSpeedUp,
} from "../../../../families/bitcoin/editTransaction";
import type {
  Transaction as BitcoinTransaction,
  TransactionStatus as BitcoinTransactionStatus,
} from "../../../../families/bitcoin/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getCoinFrameworkAccountBridge } from "../../accountBridge";
import { createTransaction } from "../../createTransaction";
import {
  fakeUtxoCoinModule,
  utxoAddress,
  type FakeUtxoChain,
  type FakeUtxoTransaction,
} from "./fakeCoinModule";
import {
  configure,
  describeStatus,
  emptyAccount,
  fakeSigner,
  freezeTime,
  FROZEN_NOW,
  normalise,
  normaliseAccount,
  serveModule,
  syncAccount,
  type Path,
} from "./harness";

jest.mock("../../api", () => ({ getCoinModuleApi: jest.fn() }));

const bitcoin = getCryptoCurrencyById("bitcoin");
const XPUB = "xpubParity";
const THEM = "bc1qthem";

const block = (height: number) => ({
  height,
  hash: `block-${height}`,
  time: new Date(Date.UTC(2026, 9, 1) + height * 60_000).toISOString(),
});

const tx = (id: string, fields: Partial<FakeUtxoTransaction>): FakeUtxoTransaction => ({
  id,
  receivedAt: "2026-10-01T00:00:00.000Z",
  block: null,
  fees: "0",
  replaceable: false,
  inputs: [],
  outputs: [],
  ...fields,
});

const funding = tx("funding", {
  block: block(90),
  inputs: [{ txid: "outside", vout: 0, address: THEM, value: "60000" }],
  outputs: [
    { index: 0, address: utxoAddress(0, 0), value: "50000" },
    { index: 1, address: THEM, value: "9000" },
  ],
  fees: "1000",
});
const spend = tx("spend", {
  block: block(95),
  inputs: [{ txid: "funding", vout: 0, address: utxoAddress(0, 0), value: "50000" }],
  outputs: [
    { index: 0, address: THEM, value: "20000" },
    { index: 1, address: utxoAddress(1, 0), value: "29000" },
  ],
  fees: "1000",
});
const received = tx("received", {
  block: block(110),
  inputs: [{ txid: "elsewhere", vout: 3, address: THEM, value: "8000" }],
  outputs: [{ index: 0, address: utxoAddress(0, 1), value: "7000" }],
  fees: "1000",
});
const mempool = tx("mempool", {
  replaceable: true,
  inputs: [{ txid: "spend", vout: 1, address: utxoAddress(1, 0), value: "29000" }],
  outputs: [
    { index: 0, address: THEM, value: "10000" },
    { index: 1, address: utxoAddress(1, 1), value: "18500" },
  ],
  fees: "500",
});

const account = (): Account =>
  emptyAccount(bitcoin, utxoAddress(0, 0), {
    derivationMode: "native_segwit",
    xpubOrAddress: XPUB,
  });

/** The pending send of the account, as `signOperation` left it. */
const withPending = (held: Account): Account => ({
  ...held,
  pendingOperations: [
    {
      id: `${held.id}-mempool-OUT`,
      hash: "mempool",
      type: "OUT",
      value: new BigNumber(10_500),
      fee: new BigNumber(500),
      senders: [utxoAddress(1, 0)],
      recipients: [THEM],
      blockHeight: null,
      blockHash: null,
      accountId: held.id,
      date: new Date(FROZEN_NOW.getTime() - 60_000),
      transactionSequenceNumber: new BigNumber(0),
      extra: { inputs: ["spend-1"] },
    } as Operation,
  ],
});

async function syncOn(path: Path, chain: FakeUtxoChain, held: Account) {
  configure(bitcoin, path);
  const module = serveModule(fakeUtxoCoinModule(chain));
  return { account: await syncAccount("bitcoin", held), module };
}

beforeAll(freezeTime);

afterAll(() => jest.useRealTimers());

afterEach(() => jest.restoreAllMocks());

describe("Bitcoin binding parity", () => {
  it("syncs the whole account the same on both paths, from scratch then incrementally", async () => {
    const chain: FakeUtxoChain = { tipHeight: 100, transactions: [funding, spend] };
    const legacy = await syncOn("legacy", chain, account());
    const portfolio = await syncOn("local", chain, account());
    expect(normaliseAccount(portfolio.account)).toEqual(normaliseAccount(legacy.account));
    expect(legacy.account).toMatchObject({
      balance: new BigNumber(29_000),
      freshAddress: utxoAddress(0, 1),
      blockHeight: 100,
      xpub: XPUB,
    });
    expect(legacy.account.subAccounts).toEqual([]);
    expect(portfolio.account.syncHash).toBe(legacy.account.syncHash);

    // A transaction received, and the account's own pending send now in the mempool.
    const next: FakeUtxoChain = {
      tipHeight: 120,
      transactions: [funding, spend, received, mempool],
    };
    const legacyNext = await syncOn("legacy", next, withPending(legacy.account));
    const portfolioNext = await syncOn("local", next, withPending(portfolio.account));
    expect(normaliseAccount(portfolioNext.account)).toEqual(normaliseAccount(legacyNext.account));
    expect(legacyNext.account.operations.map(({ hash }) => hash)).toContain("received");
  });
});

describe("Bitcoin edit transaction parity", () => {
  const chain: FakeUtxoChain = {
    tipHeight: 120,
    transactions: [funding, spend, received, mempool],
  };
  const toUpdate = {
    family: "bitcoin",
    amount: new BigNumber(10_000),
    recipient: THEM,
    familySpecificData: { replaceTxId: "mempool", rbf: true },
  } as unknown as BitcoinTransaction;

  /** What every edit flow reads, on `path`, for the account `path` synced. */
  async function editOn(path: Path) {
    const synced = (await syncOn(path, chain, withPending(account()))).account;
    const held = withPending(synced);
    configure(bitcoin, path);
    const module = serveModule(fakeUtxoCoinModule(chain));
    const speedUp = await getEditTransactionPatch({
      editType: "speedup",
      transaction: toUpdate,
      account: held,
    });
    const cancel = await getEditTransactionPatch({
      editType: "cancel",
      transaction: toUpdate,
      account: held,
    });
    const originalFeePerByte = await getOriginalTxFeeRateSatVb(held, "mempool");
    const status = getEditTransactionStatus({
      mainAccount: held,
      transaction: speedUp,
      transactionToUpdate: toUpdate,
      status: { errors: {}, warnings: {} } as unknown as BitcoinTransactionStatus,
      editType: "speedup",
      originalFeePerByte,
    });
    return {
      module,
      outputs: normalise({
        speedUp,
        cancel,
        originalFeePerByte,
        status,
        canCancel: await hasMinimumFundsToCancel({
          mainAccount: held,
          transactionToUpdate: toUpdate,
        }),
        canSpeedUp: await hasMinimumFundsToSpeedUp({
          mainAccount: held,
          transactionToUpdate: toUpdate,
        }),
      }),
    };
  }

  it("builds the same speed-up and cancel patches, status and minimum funds on both paths", async () => {
    const legacy = await editOn("legacy");
    const portfolio = await editOn("local");
    expect(portfolio.outputs).toEqual(legacy.outputs);
    expect(legacy.outputs).toMatchObject({
      speedUp: { recipient: THEM, familySpecificData: { replaceTxId: "mempool" } },
      // Back to the next change address: the pending send used the previous one.
      cancel: { recipient: utxoAddress(1, 2) },
    });
    // The portfolio path estimates the completed replacement once per read (accepted difference).
    expect(portfolio.module.getTransaction).toHaveBeenCalledWith(expect.anything(), "mempool");
  });
});

describe("Bitcoin validation parity", () => {
  it("answers a sanctioned sender of the coin module's validation as the same class on both paths", async () => {
    const sanctioned = utxoAddress(0, 0);
    const chain: FakeUtxoChain = {
      tipHeight: 100,
      transactions: [funding, spend],
      validate: (intent, { customFees }) => ({
        errors: {
          sender: new AddressesSanctionedError("AddressesSanctionedError", {
            addresses: [sanctioned],
          }),
        },
        warnings: {},
        estimatedFees: customFees.value,
        amount: intent.amount,
        totalSpent: intent.amount + customFees.value,
      }),
    };

    /** The status of a send of the account `path` synced, on `path`. */
    async function statusOn(path: Path) {
      const synced = (await syncOn(path, chain, account())).account;
      configure(bitcoin, path);
      serveModule(fakeUtxoCoinModule(chain));
      const bridge = await getCoinFrameworkAccountBridge("bitcoin", "local", fakeSigner);
      const prepared = await bridge.prepareTransaction(synced, {
        ...createTransaction(synced),
        amount: new BigNumber(1_000),
        recipient: THEM,
      });
      return describeStatus(await bridge.getTransactionStatus(synced, prepared));
    }

    const legacy = await statusOn("legacy");
    const portfolio = await statusOn("local");
    expect(portfolio).toEqual(legacy);
    expect(legacy.errors.sender).toMatchObject({
      constructor: AddressesSanctionedError,
      fields: { addresses: ["object", [sanctioned]] },
    });
  });
});
