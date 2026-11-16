import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { lastValueFrom } from "rxjs";
import {
  lockedGold,
  nonVoting,
  electionConfig,
  getCeloTransactionFeeCurrency,
} from "./__mocks__/celokit.mock";
import { mockGetCoinBalance, mockTokenEvmLogic } from "./__mocks__/evm.mock";
import { mockCreateApi, erc20Operation, nativeOperation } from "./__mocks__/operations-list.mock";
import { NATIVE_FEE_CURRENCY_MARKER } from "../constants";
import { CeloAccount, CeloOperation, CeloOperationExtra } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { accountFixture, transactionFixture, usdcTokenAccount } from "./fixtures";
import { getAccountShape, postSync, sync } from "./synchronisation";

const defaultInfo = {
  address: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
  currency: getCryptoCurrencyById("celo"),
  index: 0,
  derivationPath: "44'/52752'/0'",
  derivationMode: "",
  initialAccount: undefined,
} as const;
const defaultConfig = { blacklistedTokenIds: [], paginationConfig: {} };

lockedGold.mockResolvedValue(new BigNumber(0));
nonVoting.mockResolvedValue(new BigNumber(0));
electionConfig.mockResolvedValue({ maxNumGroupsVotedFor: 10 });

describe("When getting the account shape", () => {
  it("returns the account with correct balance and spendable balance", async () => {
    // Given
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(1010));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
    expect(result).toMatchObject({
      balance: BigNumber(1010),
      spendableBalance: BigNumber(1010),
    });
  });

  it("returns the account with 0 operations", async () => {
    // Given
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(1010));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
    expect(result).toMatchObject({
      blockHeight: 4444,
      syncHash: "0x0000000000000000000000000000000000001d00",
      operations: [],
    });
  });

  it("returns the account with 1 erc20 operation", async () => {
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [erc20Operation] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    // Given
    mockTokenEvmLogic.mockResolvedValueOnce({ ticker: "USDC", id: "0xcc" });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(1010));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);
    // Then
    expect(result).toMatchObject({
      blockHeight: 4444,
      operations: [],
      subAccounts: [
        {
          balance: undefined,
          balanceHistoryCache: {
            DAY: {
              balances: [],
              latestDate: null,
            },
            HOUR: {
              balances: [],
              latestDate: null,
            },
            WEEK: {
              balances: [],
              latestDate: null,
            },
          },
          creationDate: new Date("2026-01-09"),
          id: "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:+0xcc",
          operations: [
            {
              id: "js:2:celo:address",
              hash: "0xs",
              type: "UNLOCK",
              value: new BigNumber(200000000000000000000),
              senders: ["0x5a40FEE4eFebE3c85eDD3C79E15e221B7261a000"],
              recipients: ["0x0000000000000000000000000000000000001d00"],
              blockHeight: 2000,
              blockHash: "0xsa",
              accountId: "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:+0xcc",
              date: new Date("2026-01-09"),
              hasFailed: false,
              fee: new BigNumber(525072996210000),
              transactionSequenceNumber: undefined,
              extra: {},
              isSubAccount: true,
            },
          ],
        },
      ],
      celoResources: {
        registrationStatus: true,
        pendingWithdrawals: [],
      },
    });
  });

  it("returns the account with 1 native operation", async () => {
    // Given
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [nativeOperation] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(1010));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
    expect(result).toMatchObject({
      blockHeight: 4444,
      operationsCount: 1,
      operations: [
        {
          id: "js:2:celo:address",
          hash: "0xs",
          type: "OUT",
          value: new BigNumber(0),
          senders: ["0x5a40FEE4eFebE3c85eDD3C79E15e221B7261a000"],
          recipients: ["0x5a40FEE4eFebE3c85eDD3C79E15e221B7261a000"],
          blockHeight: 2000,
          blockHash: "0xsa",
          accountId: "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:",
          date: new Date("2026-01-09"),
          hasFailed: false,
          fee: new BigNumber(525072996210000),
          // Sent by another address, so its nonce is not the account's.
          transactionSequenceNumber: undefined,
          extra: {},
          isSubAccount: false,
        },
      ],
    });
  });

  it("returns the account with correct id, and celo resources", async () => {
    // Given
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [nativeOperation] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(20));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
    expect(result).toMatchObject({
      id: "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:",
      celoResources: {
        electionAddress: "0x000000000000000000000000000000000000ce10",
        lockedGoldAddress: "0x0000000000000000000000000000000000001d00",
      },
    });
    expect(result.spendableBalance).toEqual(BigNumber(20));
  });
});

describe("pending operation retention", () => {
  const sender = nativeOperation.senders[0];
  const senderInfo = { ...defaultInfo, address: sender };
  const senderAccount: CeloAccount = {
    ...accountFixture,
    id: `js:2:celo:${sender}:`,
    freshAddress: sender,
    syncHash: "0x0000000000000000000000000000000000001d00",
  };
  const pending = (nonce: number, hash = `0xpending${nonce}`) => ({
    ...buildOptimisticOperation(senderAccount, transactionFixture, new BigNumber(2), { nonce }),
    hash,
  });
  const nonces = (ops: Operation[]) => ops.map(op => op.transactionSequenceNumber?.toNumber());

  it("drops the optimistic op on the sync that brings in its nonce", async () => {
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [nativeOperation] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(0));
    const initial = { ...senderAccount, pendingOperations: [pending(112), pending(111)] };

    const updater = await lastValueFrom(sync(initial, defaultConfig));

    expect(nonces(updater(initial).pendingOperations)).toEqual([112]);
  });

  it("prunes token pending ops that are confirmed or outnumbered by the parent's nonce", () => {
    const synced: CeloAccount = {
      ...senderAccount,
      operations: [{ ...pending(111, "0xs"), blockHeight: 2000 }],
      subAccounts: [
        {
          ...usdcTokenAccount,
          operations: [{ ...pending(113, "0xconfirmed"), blockHeight: 2001 }],
          pendingOperations: [pending(113, "0xconfirmed"), pending(112), pending(111)],
        },
      ],
    };

    const result = postSync(senderAccount, synced);

    expect(nonces(result.subAccounts?.[0].pendingOperations ?? [])).toEqual([112]);
  });

  it("looks past a newer nonce-less row to the confirmed nonce", () => {
    const synced: CeloAccount = {
      ...senderAccount,
      operations: [
        {
          ...pending(0, "0xtransferfrom"),
          transactionSequenceNumber: undefined,
          blockHeight: 2001,
        },
        { ...pending(111, "0xreplacement"), blockHeight: 2000 },
      ],
      pendingOperations: [pending(112), pending(111)],
    };

    const result = postSync(senderAccount, synced);

    expect(nonces(result.pendingOperations)).toEqual([112]);
  });

  it.each([
    ["a string", "111", new BigNumber(111)],
    ["a number", 111, new BigNumber(111)],
    ["a bigint", 111n, new BigNumber(111)],
    ["an empty string", "", undefined],
    ["missing", undefined, undefined],
  ])("reads the explorer nonce when it is %s", async (_, sequence, expected) => {
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({
        items: [{ ...nativeOperation, details: { ...nativeOperation.details, sequence } }],
      }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(0));

    const result = await getAccountShape(senderInfo, defaultConfig);

    expect(result.operations?.[0].transactionSequenceNumber).toEqual(expected);
  });

  it.each([
    ["a native tx it sent", nativeOperation, new BigNumber(111)],
    [
      "a native tx someone else sent",
      { ...nativeOperation, senders: ["0x0000000000000000000000000000000000000bad"] },
      undefined,
    ],
    [
      "a CELO token row of a tx it sent",
      { ...erc20Operation, details: { sequence: "111", parentSenders: [sender.toLowerCase()] } },
      new BigNumber(111),
    ],
    [
      "a CELO token row of someone else's transferFrom",
      { ...erc20Operation, senders: [sender], details: { sequence: "999" } },
      undefined,
    ],
  ])("keeps the nonce only for %s", async (_, item, expected) => {
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [item] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockTokenEvmLogic.mockResolvedValueOnce({ ticker: "CELO", id: "celo/erc20/celo" });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(0));

    const result = await getAccountShape(senderInfo, defaultConfig);

    expect(result.operations?.[0].transactionSequenceNumber).toEqual(expected);
  });
});

describe("fee-currency enrichment", () => {
  // Must match SAFE_REORG_THRESHOLD in src/bridge/synchronisation.ts.
  const REORG_THRESHOLD = 80;
  const CIP64_TOKEN = "0xceeb000000000000000000000000000000000001";
  const SYNC_HASH = "0x0000000000000000000000000000000000001d00";

  const buildCeloOperation = (overrides: {
    hash: string;
    blockHeight: number;
    extra: CeloOperationExtra;
  }): CeloOperation => ({
    id: `js:2:celo:${overrides.hash}`,
    hash: overrides.hash,
    type: "OUT",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: overrides.blockHeight,
    blockHash: null,
    accountId: accountFixture.id,
    date: new Date("2026-01-09"),
    hasFailed: false,
    extra: overrides.extra,
  });

  const buildInitialAccount = (operations: CeloOperation[]): CeloAccount => ({
    ...accountFixture,
    syncHash: SYNC_HASH,
    operations,
  });

  beforeEach(() => {
    getCeloTransactionFeeCurrency.mockReset();
    // Default: tx is native CELO (matches the default mock behavior).
    getCeloTransactionFeeCurrency.mockResolvedValue(null);
  });

  it("backfills NATIVE sentinel on a confirmed non-CIP-64 op", async () => {
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [nativeOperation] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(0));
    getCeloTransactionFeeCurrency.mockResolvedValueOnce(null);

    const result = await getAccountShape(defaultInfo, defaultConfig);

    expect(result.operations?.[0]?.extra).toMatchObject({
      feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER,
    });
    expect(getCeloTransactionFeeCurrency).toHaveBeenCalledWith(nativeOperation.tx.hash);
  });

  it("backfills lowercased fee-currency address on a CIP-64 op", async () => {
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [nativeOperation] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(0));
    getCeloTransactionFeeCurrency.mockResolvedValueOnce(CIP64_TOKEN);

    const result = await getAccountShape(defaultInfo, defaultConfig);

    expect(result.operations?.[0]?.extra).toMatchObject({
      feeCurrencyAddress: CIP64_TOKEN,
    });
  });

  it("leaves the op unmarked when the RPC throws (no false sentinel)", async () => {
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [nativeOperation] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(0));
    getCeloTransactionFeeCurrency.mockRejectedValueOnce(new Error("rpc down"));

    const result = await getAccountShape(defaultInfo, defaultConfig);

    expect(result.operations?.[0]?.extra).not.toHaveProperty("feeCurrencyAddress");
  });

  it("re-fetches NATIVE sentinels inside the reorg window", async () => {
    const tipHeight = nativeOperation.tx.block.height + REORG_THRESHOLD - 1; // in-window
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [nativeOperation] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: tipHeight }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(0));
    getCeloTransactionFeeCurrency.mockResolvedValueOnce(CIP64_TOKEN);

    const initialAccount = buildInitialAccount([
      buildCeloOperation({
        hash: nativeOperation.tx.hash,
        blockHeight: nativeOperation.tx.block.height,
        extra: { feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER },
      }),
    ]);

    const result = await getAccountShape({ ...defaultInfo, initialAccount }, defaultConfig);

    expect(getCeloTransactionFeeCurrency).toHaveBeenCalledWith(nativeOperation.tx.hash);
    expect(result.operations?.[0]?.extra).toMatchObject({ feeCurrencyAddress: CIP64_TOKEN });
  });

  it("trusts NATIVE sentinels past the reorg window (no re-fetch)", async () => {
    const tipHeight = nativeOperation.tx.block.height + REORG_THRESHOLD + 10; // out-of-window
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [nativeOperation] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: tipHeight }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(0));

    const initialAccount = buildInitialAccount([
      buildCeloOperation({
        hash: nativeOperation.tx.hash,
        blockHeight: nativeOperation.tx.block.height,
        extra: { feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER },
      }),
    ]);

    const result = await getAccountShape({ ...defaultInfo, initialAccount }, defaultConfig);

    expect(getCeloTransactionFeeCurrency).not.toHaveBeenCalled();
    expect(result.operations?.[0]?.extra).toMatchObject({
      feeCurrencyAddress: NATIVE_FEE_CURRENCY_MARKER,
    });
  });
});
