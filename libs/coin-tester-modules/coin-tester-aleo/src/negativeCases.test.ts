import { firstValueFrom, reduce } from "rxjs";
import { setupServer } from "msw/node";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import BigNumber from "bignumber.js";
import {
  TRANSACTION_TYPE,
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
} from "@ledgerhq/coin-aleo/constants";
import {
  AleoAmountRecordRequired,
  AleoFeeRecordInsufficientBalance,
  AleoFeeRecordRequired,
  AleoTooManyRecordsSelected,
  AleoTwoRecordsRequired,
} from "@ledgerhq/coin-aleo/errors";
import type {
  AleoAccount,
  TransactionPrivate as AleoTransactionPrivate,
  TransactionTransfer as AleoTransactionTransfer,
} from "@ledgerhq/coin-aleo/types";
import { advanceBlocks, killStack, registerTeardownHooks, spawnStack } from "./stack";
import {
  PRIVATE_DEVNODE_FEE_RANGE,
  TRANSFER_PRIVATE_BASE_FEE,
  TRANSFER_PUBLIC_BASE_FEE,
  buildAleoCoinConfig,
  generateAleoAccount,
  getPublicBalance,
  makeAleoAccount,
  makePrivateAleoAccount,
  type GeneratedAleoAccount,
} from "./fixtures";
import { mintPrivateRecord, mintPrivateRecords } from "./mint";
import { buildTransaction } from "./msw/prove";
import { buildAleoHandlers, buildScannerHandlers } from "./msw/handlers";
import { createFakeScanner } from "./msw/scanner";
import { buildMockAleoSigner } from "./signer";
import { getBridges } from "./helpers";

jest.setTimeout(600_000);

registerTeardownHooks();

beforeAll(async () => {
  await spawnStack();
});

afterAll(async () => {
  await killStack();
});

/**
 * Sends `amount` straight to the devnode from GENESIS_ACCOUNT, bypassing the
 * bridge under test, and waits until `recipientAddress`'s public balance
 * reflects it.
 */
async function fundFromGenesis(recipientAddress: string, amount: number): Promise<void> {
  await buildTransaction({ recipient: recipientAddress, amount });

  for (let attempt = 0; attempt < 10; attempt++) {
    await advanceBlocks(1);
    if ((await getPublicBalance(recipientAddress)) >= BigInt(amount)) return;
  }

  throw new Error(`aleo coin-tester: funding transfer to ${recipientAddress} did not confirm`);
}

describe("a private send-max over 14 records leaves none for the fee", () => {
  let owner: GeneratedAleoAccount;
  let recipient: GeneratedAleoAccount;
  const mockServer = setupServer();

  beforeAll(
    async () => {
      setCryptoAssetsStore({
        findTokenById: async () => undefined,
        findTokenByAddressInCurrency: async () => undefined,
        getTokensSyncHash: async () => "",
      });

      [owner, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

      await mintPrivateRecords({
        recipient: owner.address,
        count: MAX_PRIVATE_RECORDS_PER_TRANSACTION,
        smallest: PRIVATE_DEVNODE_FEE_RANGE.max,
      });

      const scanner = createFakeScanner();
      await scanner.setup();
      scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });

      mockServer.listen({
        onUnhandledRequest: request => {
          const { hostname } = new URL(request.url);
          if (["127.0.0.1", "localhost"].includes(hostname)) return;
          throw new Error(`Unhandled request: ${request.method} ${request.url}`);
        },
      });
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

  it("reports AleoFeeRecordRequired when all 14 records are claimed as amount records", async () => {
    const signer = buildMockAleoSigner(owner.privateKey);
    const { accountBridge } = getBridges(signer, buildAleoCoinConfig());
    const account = makePrivateAleoAccount(owner.address, owner.viewKey);

    const synced = await firstValueFrom(
      accountBridge
        .sync(account, { paginationConfig: {} })
        .pipe(reduce((acc, applyPatch) => applyPatch(acc), account)),
    );

    expect(synced.aleoResources?.unspentPrivateRecords).toHaveLength(
      MAX_PRIVATE_RECORDS_PER_TRANSACTION,
    );

    const transaction: AleoTransactionPrivate = {
      ...accountBridge.createTransaction(synced),
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      recipient: recipient.address,
      amount: new BigNumber(0),
      useAllAmount: true,
      properties: { amountRecordCommitments: [], feeRecordCommitment: null },
    } as AleoTransactionPrivate;

    const prepared = (await accountBridge.prepareTransaction(
      synced,
      transaction,
    )) as AleoTransactionPrivate;
    expect(prepared.properties.amountRecordCommitments).toHaveLength(
      MAX_PRIVATE_RECORDS_PER_TRANSACTION,
    );

    const status = await accountBridge.getTransactionStatus(synced, prepared);

    expect(status.errors.feeRecord).toBeInstanceOf(AleoFeeRecordRequired);
  });
});

describe("a public transfer for more than the synced balance", () => {
  let sender: GeneratedAleoAccount;
  let recipient: GeneratedAleoAccount;
  const mockServer = setupServer();
  const FUNDING_AMOUNT = 500_000;

  beforeAll(
    async () => {
      setCryptoAssetsStore({
        findTokenById: async () => undefined,
        findTokenByAddressInCurrency: async () => undefined,
        getTokensSyncHash: async () => "",
      });

      [sender, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

      mockServer.listen({
        onUnhandledRequest: request => {
          const { hostname } = new URL(request.url);
          if (["127.0.0.1", "localhost"].includes(hostname)) return;
          throw new Error(`Unhandled request: ${request.method} ${request.url}`);
        },
      });
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

    const synced = await firstValueFrom(
      accountBridge
        .sync(account, { paginationConfig: {} })
        .pipe(reduce((acc, applyPatch) => applyPatch(acc), account)),
    );

    expect(synced.balance.toNumber()).toBeGreaterThan(0);

    const transaction: AleoTransactionTransfer = {
      ...accountBridge.createTransaction(synced),
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      recipient: recipient.address,
      amount: synced.balance.plus(1),
      useAllAmount: false,
    } as AleoTransactionTransfer;

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
      setCryptoAssetsStore({
        findTokenById: async () => undefined,
        findTokenByAddressInCurrency: async () => undefined,
        getTokensSyncHash: async () => "",
      });

      [owner, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

      await mintPrivateRecords({
        recipient: owner.address,
        count: 1,
        smallest: PRIVATE_DEVNODE_FEE_RANGE.max,
      });

      const scanner = createFakeScanner();
      await scanner.setup();
      scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });

      mockServer.listen({
        onUnhandledRequest: request => {
          const { hostname } = new URL(request.url);
          if (["127.0.0.1", "localhost"].includes(hostname)) return;
          throw new Error(`Unhandled request: ${request.method} ${request.url}`);
        },
      });
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

  it("reports AleoTwoRecordsRequired, not a fee-balance error, for a one-record account", async () => {
    const signer = buildMockAleoSigner(owner.privateKey);
    const { accountBridge } = getBridges(signer, buildAleoCoinConfig());
    const account = makePrivateAleoAccount(owner.address, owner.viewKey);

    const synced = await firstValueFrom(
      accountBridge
        .sync(account, { paginationConfig: {} })
        .pipe(reduce((acc, applyPatch) => applyPatch(acc), account)),
    );

    expect(synced.aleoResources?.unspentPrivateRecords).toHaveLength(1);

    const transaction: AleoTransactionPrivate = {
      ...accountBridge.createTransaction(synced),
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      recipient: recipient.address,
      amount: new BigNumber(0),
      useAllAmount: true,
      properties: { amountRecordCommitments: [], feeRecordCommitment: null },
    } as AleoTransactionPrivate;

    const prepared = await accountBridge.prepareTransaction(synced, transaction);
    const status = await accountBridge.getTransactionStatus(synced, prepared);

    expect(status.errors.feeRecord).toBeInstanceOf(AleoTwoRecordsRequired);
  });
});

/**
 * Balance the sender holds publicly. Large enough that the transparent-balance
 * checks at the end of getTransactionStatus stay quiet, so each case reports
 * the input error under test instead of NotEnoughBalance.
 */
const INPUT_VALIDATION_BALANCE = TRANSFER_PUBLIC_BASE_FEE * 10;

/**
 * Replaces the last character of `address` with another one from the bech32m
 * alphabet. The result keeps the aleo prefix and the 63-character length, so
 * validateAddress rejects it on the checksum rather than on the shape.
 */
function corruptAleoAddress(address: string): string {
  return address.slice(0, -1) + (address.endsWith("q") ? "p" : "q");
}

function makeFundedPublicAleoAccount(account: GeneratedAleoAccount): AleoAccount {
  const balance = new BigNumber(INPUT_VALIDATION_BALANCE);

  return {
    ...makeAleoAccount(account.address, account.viewKey),
    balance,
    spendableBalance: balance,
    aleoResources: {
      transparentBalance: balance,
      provableApi: null,
      privateBalance: null,
      unspentPrivateRecords: null,
      lastPrivateSyncDate: null,
    },
  };
}

describe("public transfers with invalid inputs", () => {
  let sender: GeneratedAleoAccount;
  let recipient: GeneratedAleoAccount;

  beforeAll(async () => {
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    });

    [sender, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);
  });

  /**
   * getTransactionStatus reads the balance off the account and validates the
   * address in process, so these cases need neither a sync nor a broadcast.
   */
  async function statusFor(overrides: Partial<AleoTransactionTransfer>) {
    const signer = buildMockAleoSigner(sender.privateKey);
    const { accountBridge } = getBridges(signer, buildAleoCoinConfig());
    const account = makeFundedPublicAleoAccount(sender);

    const transaction: AleoTransactionTransfer = {
      ...accountBridge.createTransaction(account),
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      recipient: recipient.address,
      amount: new BigNumber(1_000),
      useAllAmount: false,
      ...overrides,
    } as AleoTransactionTransfer;

    return accountBridge.getTransactionStatus(account, transaction);
  }

  it("reports AmountRequired for a zero amount that is not a send-max", async () => {
    const status = await statusFor({ amount: new BigNumber(0) });

    expect(status.errors.amount?.name).toBe("AmountRequired");
  });

  it("reports RecipientRequired for an empty recipient", async () => {
    const status = await statusFor({ recipient: "" });

    expect(status.errors.recipient?.name).toBe("RecipientRequired");
  });

  it("reports InvalidAddress for a recipient that fails bech32m decoding", async () => {
    const status = await statusFor({ recipient: corruptAleoAddress(recipient.address) });

    expect(status.errors.recipient?.name).toBe("InvalidAddress");
  });

  it("reports InvalidAddressBecauseDestinationIsAlsoSource when the recipient is the sender", async () => {
    const status = await statusFor({ recipient: sender.address });

    expect(status.errors.recipient?.name).toBe("InvalidAddressBecauseDestinationIsAlsoSource");
  });
});

describe("a private transfer under the manual record-picking strategy", () => {
  let owner: GeneratedAleoAccount;
  let recipient: GeneratedAleoAccount;
  const mockServer = setupServer();
  const RECORD_COUNT = MAX_PRIVATE_RECORDS_PER_TRANSACTION + 1;

  beforeAll(
    async () => {
      setCryptoAssetsStore({
        findTokenById: async () => undefined,
        findTokenByAddressInCurrency: async () => undefined,
        getTokensSyncHash: async () => "",
      });

      [owner, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

      await mintPrivateRecords({
        recipient: owner.address,
        count: RECORD_COUNT,
        smallest: PRIVATE_DEVNODE_FEE_RANGE.max,
      });

      const scanner = createFakeScanner();
      await scanner.setup();
      scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });

      mockServer.listen({
        onUnhandledRequest: request => {
          const { hostname } = new URL(request.url);
          if (["127.0.0.1", "localhost"].includes(hostname)) return;
          throw new Error(`Unhandled request: ${request.method} ${request.url}`);
        },
      });
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

  /**
   * Syncs owner and returns the commitments of every unspent record. The manual
   * strategy makes prepareTransaction pass amountRecordCommitments through
   * untouched, so a test picks the selection itself.
   */
  async function syncOwner(): Promise<{
    accountBridge: ReturnType<typeof getBridges>["accountBridge"];
    synced: AleoAccount;
    commitments: string[];
  }> {
    const signer = buildMockAleoSigner(owner.privateKey);
    const { accountBridge } = getBridges(
      signer,
      buildAleoCoinConfig({ recordPickingStrategy: "manual" }),
    );
    const account = makePrivateAleoAccount(owner.address, owner.viewKey);

    const synced = await firstValueFrom(
      accountBridge
        .sync(account, { paginationConfig: {} })
        .pipe(reduce((acc, applyPatch) => applyPatch(acc), account)),
    );

    const records = synced.aleoResources?.unspentPrivateRecords ?? [];

    return { accountBridge, synced, commitments: records.map(record => record.commitment) };
  }

  it("reports AleoAmountRecordRequired when no amount record was picked", async () => {
    const { accountBridge, synced } = await syncOwner();

    expect(synced.aleoResources?.unspentPrivateRecords).toHaveLength(RECORD_COUNT);

    const transaction: AleoTransactionPrivate = {
      ...accountBridge.createTransaction(synced),
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      recipient: recipient.address,
      amount: new BigNumber(1_000),
      useAllAmount: false,
      properties: { amountRecordCommitments: [], feeRecordCommitment: null },
    } as AleoTransactionPrivate;

    const prepared = (await accountBridge.prepareTransaction(
      synced,
      transaction,
    )) as AleoTransactionPrivate;
    expect(prepared.properties.amountRecordCommitments).toHaveLength(0);

    const status = await accountBridge.getTransactionStatus(synced, prepared);

    expect(status.errors.amountRecord).toBeInstanceOf(AleoAmountRecordRequired);
  });

  it("reports AleoTooManyRecordsSelected when 15 amount records are picked", async () => {
    const { accountBridge, synced, commitments } = await syncOwner();

    expect(commitments).toHaveLength(RECORD_COUNT);

    const transaction: AleoTransactionPrivate = {
      ...accountBridge.createTransaction(synced),
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      recipient: recipient.address,
      amount: new BigNumber(1_000),
      useAllAmount: false,
      properties: { amountRecordCommitments: commitments, feeRecordCommitment: null },
    } as AleoTransactionPrivate;

    const prepared = (await accountBridge.prepareTransaction(
      synced,
      transaction,
    )) as AleoTransactionPrivate;
    expect(prepared.properties.amountRecordCommitments).toHaveLength(RECORD_COUNT);

    const status = await accountBridge.getTransactionStatus(synced, prepared);

    expect(status.errors.amount).toBeInstanceOf(AleoTooManyRecordsSelected);
  });
});

/** Record the private transfer spends as its amount. */
const AMOUNT_RECORD_MICROCREDITS = 200_000;

/**
 * Record the private transfer nominates for the fee. Below
 * TRANSFER_PRIVATE_BASE_FEE, the amount validatePrivateFeeRecord compares a fee
 * record against.
 */
const UNDERFUNDED_FEE_RECORD_MICROCREDITS = 1_000;

describe("a private transfer whose fee record cannot cover the fee", () => {
  let owner: GeneratedAleoAccount;
  let recipient: GeneratedAleoAccount;
  const mockServer = setupServer();

  beforeAll(
    async () => {
      setCryptoAssetsStore({
        findTokenById: async () => undefined,
        findTokenByAddressInCurrency: async () => undefined,
        getTokensSyncHash: async () => "",
      });

      [owner, recipient] = await Promise.all([generateAleoAccount(), generateAleoAccount()]);

      // mintPrivateRecords floors every record at PRIVATE_DEVNODE_FEE_RANGE.max,
      // so the underfunded record is minted through the single-record helper.
      await mintPrivateRecord(owner.address, AMOUNT_RECORD_MICROCREDITS);
      await mintPrivateRecord(owner.address, UNDERFUNDED_FEE_RECORD_MICROCREDITS);

      const scanner = createFakeScanner();
      await scanner.setup();
      scanner.registerAccount({ viewKey: owner.viewKey, address: owner.address });

      mockServer.listen({
        onUnhandledRequest: request => {
          const { hostname } = new URL(request.url);
          if (["127.0.0.1", "localhost"].includes(hostname)) return;
          throw new Error(`Unhandled request: ${request.method} ${request.url}`);
        },
      });
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

  it("reports AleoFeeRecordInsufficientBalance for a fee record below the billed fee", async () => {
    const signer = buildMockAleoSigner(owner.privateKey);
    const { accountBridge } = getBridges(
      signer,
      buildAleoCoinConfig({ recordPickingStrategy: "manual" }),
    );
    const account = makePrivateAleoAccount(owner.address, owner.viewKey);

    const synced = await firstValueFrom(
      accountBridge
        .sync(account, { paginationConfig: {} })
        .pipe(reduce((acc, applyPatch) => applyPatch(acc), account)),
    );

    const records = synced.aleoResources?.unspentPrivateRecords ?? [];
    expect(records).toHaveLength(2);

    const feeRecord = records.find(record =>
      new BigNumber(record.microcredits).isEqualTo(UNDERFUNDED_FEE_RECORD_MICROCREDITS),
    );
    const amountRecord = records.find(record =>
      new BigNumber(record.microcredits).isEqualTo(AMOUNT_RECORD_MICROCREDITS),
    );
    expect(feeRecord).toBeDefined();
    expect(amountRecord).toBeDefined();
    expect(UNDERFUNDED_FEE_RECORD_MICROCREDITS).toBeLessThan(TRANSFER_PRIVATE_BASE_FEE);

    const transaction: AleoTransactionPrivate = {
      ...accountBridge.createTransaction(synced),
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      recipient: recipient.address,
      amount: new BigNumber(1_000),
      useAllAmount: false,
      properties: {
        amountRecordCommitments: [amountRecord!.commitment],
        feeRecordCommitment: feeRecord!.commitment,
      },
    } as AleoTransactionPrivate;

    // No record besides the amount record covers the fee, so
    // resolveFeeRecordCommitment keeps the underfunded one this test names.
    const prepared = (await accountBridge.prepareTransaction(
      synced,
      transaction,
    )) as AleoTransactionPrivate;
    expect(prepared.properties.feeRecordCommitment).toBe(feeRecord!.commitment);

    const status = await accountBridge.getTransactionStatus(synced, prepared);

    expect(status.errors.feeRecord).toBeInstanceOf(AleoFeeRecordInsufficientBalance);
  });
});
