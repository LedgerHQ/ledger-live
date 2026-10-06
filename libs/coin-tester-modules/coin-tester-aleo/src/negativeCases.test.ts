import { setupServer } from "msw/node";
import BigNumber from "bignumber.js";
import {
  TRANSACTION_TYPE,
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
} from "@ledgerhq/coin-aleo/constants";
import { AleoAmountRecordRequired, AleoTooManyRecordsSelected } from "@ledgerhq/coin-aleo/errors";
import type {
  Transaction as AleoTransaction,
  TransactionPrivate as AleoTransactionPrivate,
  TransactionTransfer as AleoTransactionTransfer,
} from "@ledgerhq/coin-aleo/types";
import { killStack, registerTeardownHooks, spawnStack } from "./stack";
import {
  buildAleoCoinConfig,
  generateAleoAccount,
  makeAleoAccount,
  makePrivateAleoAccount,
  type GeneratedAleoAccount,
} from "./fixtures";
import { mintPrivateRecords } from "./mint";
import { buildAleoHandlers, buildScannerHandlers } from "./msw/handlers";
import { createFakeScanner } from "./msw/scanner";
import { buildMockAleoSigner } from "./signer";
import { getBridges } from "./helpers";
import { fundFromGenesis, startMockServer, syncAccount } from "./testSetup";

jest.setTimeout(600_000);

registerTeardownHooks();

beforeAll(async () => {
  await spawnStack();
});

afterAll(async () => {
  await killStack();
});

function publicTransfer(
  base: AleoTransaction,
  fields: Pick<AleoTransactionTransfer, "recipient" | "amount" | "useAllAmount">,
): AleoTransactionTransfer {
  // A public transfer carries no record selection, whatever mode `base` was created in.
  return { ...base, ...fields, mode: TRANSACTION_TYPE.TRANSFER_PUBLIC, properties: undefined };
}

function privateTransfer(
  base: AleoTransaction,
  fields: Pick<AleoTransactionPrivate, "recipient" | "amount" | "useAllAmount" | "properties">,
): AleoTransactionPrivate {
  return { ...base, ...fields, mode: TRANSACTION_TYPE.TRANSFER_PRIVATE };
}

function expectPrivateTransfer(transaction: AleoTransaction): AleoTransactionPrivate {
  if (transaction.mode !== TRANSACTION_TYPE.TRANSFER_PRIVATE) {
    throw new Error(`expected a private transfer, got mode ${transaction.mode}`);
  }
  return transaction;
}

const SMALLEST_RECORD_MICROCREDITS = 100_000;

describe("a public transfer for more than the synced balance", () => {
  let sender: GeneratedAleoAccount;
  let recipient: GeneratedAleoAccount;
  const mockServer = setupServer();
  const FUNDING_AMOUNT = 500_000;

  beforeAll(
    async () => {
      [sender, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

      startMockServer(mockServer);
      mockServer.use(...buildAleoHandlers({ recipient: sender.address, amount: 0 }));

      await fundFromGenesis(sender.address, FUNDING_AMOUNT);
    },
    15 * 60 * 1000,
  );

  afterAll(() => {
    mockServer.close();
  });

  it("reports NotEnoughBalance for the synced balance plus one microcredit", async () => {
    const signer = buildMockAleoSigner(sender.privateKey);
    const { accountBridge } = getBridges(signer, buildAleoCoinConfig());
    const account = makeAleoAccount(sender.address, sender.viewKey);

    const synced = await syncAccount(accountBridge, account);

    expect(synced.balance.toNumber()).toBeGreaterThan(0);

    const transaction = publicTransfer(accountBridge.createTransaction(synced), {
      recipient: recipient.address,
      amount: synced.balance.plus(1),
      useAllAmount: false,
    });

    const prepared = await accountBridge.prepareTransaction(synced, transaction);
    const status = await accountBridge.getTransactionStatus(synced, prepared);

    expect(status.errors.amount?.name).toBe("NotEnoughBalance");
  });
});

describe("a private transfer from an account with a single record", () => {
  let owner: GeneratedAleoAccount;
  let recipient: GeneratedAleoAccount;
  const mockServer = setupServer();

  beforeAll(
    async () => {
      [owner, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

      await mintPrivateRecords({
        recipient: owner.address,
        count: 1,
        smallest: SMALLEST_RECORD_MICROCREDITS,
      });

      const scanner = createFakeScanner();
      await scanner.setup();
      scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });

      startMockServer(mockServer);
      mockServer.use(
        ...buildAleoHandlers({ recipient: recipient.address, amount: 0 }),
        ...buildScannerHandlers(scanner),
      );
    },
    15 * 60 * 1000,
  );

  afterAll(() => {
    mockServer.close();
  });

  it("reports no error and picks no fee record for a one-record send-max, since the fee is sponsored", async () => {
    const signer = buildMockAleoSigner(owner.privateKey);
    const { accountBridge } = getBridges(signer, buildAleoCoinConfig());
    const account = makePrivateAleoAccount(owner.address, owner.viewKey);

    const synced = await syncAccount(accountBridge, account);

    expect(synced.aleoResources?.unspentPrivateRecords).toHaveLength(1);

    const transaction = privateTransfer(accountBridge.createTransaction(synced), {
      recipient: recipient.address,
      amount: new BigNumber(0),
      useAllAmount: true,
      properties: { amountRecordCommitments: [], feeRecordCommitment: null },
    });

    const prepared = expectPrivateTransfer(
      await accountBridge.prepareTransaction(synced, transaction),
    );
    const status = await accountBridge.getTransactionStatus(synced, prepared);

    expect(prepared.properties.feeRecordCommitment).toBeNull();
    expect(prepared.properties.amountRecordCommitments).toHaveLength(1);
    expect(status.errors).toStrictEqual({});
    expect(status.amount).toStrictEqual(new BigNumber(SMALLEST_RECORD_MICROCREDITS));
  });
});

describe("a private transfer under the manual record-picking strategy", () => {
  let owner: GeneratedAleoAccount;
  let recipient: GeneratedAleoAccount;
  const mockServer = setupServer();
  const RECORD_COUNT = MAX_PRIVATE_RECORDS_PER_TRANSACTION + 1;

  beforeAll(
    async () => {
      [owner, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

      await mintPrivateRecords({
        recipient: owner.address,
        count: RECORD_COUNT,
        smallest: SMALLEST_RECORD_MICROCREDITS,
      });

      const scanner = createFakeScanner();
      await scanner.setup();
      scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });

      startMockServer(mockServer);
      mockServer.use(
        ...buildAleoHandlers({ recipient: recipient.address, amount: 0 }),
        ...buildScannerHandlers(scanner),
      );
    },
    15 * 60 * 1000,
  );

  afterAll(() => {
    mockServer.close();
  });

  async function syncOwner() {
    const signer = buildMockAleoSigner(owner.privateKey);
    const { accountBridge } = getBridges(
      signer,
      buildAleoCoinConfig({ recordPickingStrategy: "manual" }),
    );
    const account = makePrivateAleoAccount(owner.address, owner.viewKey);

    const synced = await syncAccount(accountBridge, account);

    const records = synced.aleoResources?.unspentPrivateRecords ?? [];

    return { accountBridge, synced, commitments: records.map(record => record.commitment) };
  }

  it("reports AleoAmountRecordRequired when no amount record was picked", async () => {
    const { accountBridge, synced } = await syncOwner();

    expect(synced.aleoResources?.unspentPrivateRecords).toHaveLength(RECORD_COUNT);

    const transaction = privateTransfer(accountBridge.createTransaction(synced), {
      recipient: recipient.address,
      amount: new BigNumber(1_000),
      useAllAmount: false,
      properties: { amountRecordCommitments: [], feeRecordCommitment: null },
    });

    const prepared = expectPrivateTransfer(
      await accountBridge.prepareTransaction(synced, transaction),
    );
    expect(prepared.properties.amountRecordCommitments).toHaveLength(0);

    const status = await accountBridge.getTransactionStatus(synced, prepared);

    expect(status.errors.amountRecord).toBeInstanceOf(AleoAmountRecordRequired);
  });

  it("reports AleoTooManyRecordsSelected when more amount records than the maximum are picked", async () => {
    const { accountBridge, synced, commitments } = await syncOwner();

    expect(commitments).toHaveLength(RECORD_COUNT);

    const transaction = privateTransfer(accountBridge.createTransaction(synced), {
      recipient: recipient.address,
      amount: new BigNumber(1_000),
      useAllAmount: false,
      properties: { amountRecordCommitments: commitments, feeRecordCommitment: null },
    });

    const prepared = expectPrivateTransfer(
      await accountBridge.prepareTransaction(synced, transaction),
    );
    expect(prepared.properties.amountRecordCommitments).toHaveLength(RECORD_COUNT);

    const status = await accountBridge.getTransactionStatus(synced, prepared);

    expect(status.errors.amount).toBeInstanceOf(AleoTooManyRecordsSelected);
  });
});
