import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { lastValueFrom } from "rxjs";
import { lockedGold, nonVoting, electionConfig } from "./__mocks__/celokit.mock";
import { mockGetCoinBalance, mockGetTokenBalance, mockTokenEvmLogic } from "./__mocks__/evm.mock";
import { mockCreateApi, erc20Operation, nativeOperation } from "./__mocks__/operations-list.mock";
import { CeloAccount } from "../types";
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

  it("prunes token pending ops that are confirmed or outnumbered by a confirmed nonce", () => {
    const synced: CeloAccount = {
      ...senderAccount,
      operations: [{ ...pending(111, "0xs"), blockHeight: 2000 }],
      subAccounts: [
        {
          ...usdcTokenAccount,
          operations: [{ ...pending(113, "0xconfirmed"), blockHeight: 2001 }],
          pendingOperations: [pending(114), pending(113, "0xconfirmed"), pending(112)],
        },
      ],
    };

    const result = postSync(senderAccount, synced);

    expect(nonces(result.subAccounts?.[0].pendingOperations ?? [])).toEqual([114]);
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

  it("prunes a pending op outnumbered by a token-only transaction", () => {
    const synced: CeloAccount = {
      ...senderAccount,
      operations: [{ ...pending(110, "0xolder"), blockHeight: 1999 }],
      pendingOperations: [pending(112), pending(111)],
      subAccounts: [
        {
          ...usdcTokenAccount,
          operations: [{ ...pending(111, "0xtokenonly"), blockHeight: 2000 }],
          pendingOperations: [pending(111, "0xreplaced")],
        },
      ],
    };

    const result = postSync(senderAccount, synced);

    expect(nonces(result.pendingOperations)).toEqual([112]);
    expect(result.subAccounts?.[0].pendingOperations).toEqual([]);
  });

  it("keeps a token pending op added while the sync ran", () => {
    const addedDuringSync = { ...pending(112), accountId: usdcTokenAccount.id };
    const current: CeloAccount = {
      ...senderAccount,
      subAccounts: [{ ...usdcTokenAccount, pendingOperations: [addedDuringSync] }],
    };
    const synced: CeloAccount = {
      ...senderAccount,
      operations: [{ ...pending(111, "0xs"), blockHeight: 2000 }],
      subAccounts: [{ ...usdcTokenAccount, operations: [], pendingOperations: [] }],
    };

    const result = postSync(current, synced);

    expect(result.subAccounts?.[0].pendingOperations).toEqual([addedDuringSync]);
  });

  it("drops a token pending op replaced while the sync ran", () => {
    const replaced = { ...pending(112, "0xreplaced"), accountId: usdcTokenAccount.id };
    const replacement = { ...pending(112, "0xreplacement"), accountId: usdcTokenAccount.id };
    const current: CeloAccount = {
      ...senderAccount,
      subAccounts: [{ ...usdcTokenAccount, pendingOperations: [replacement] }],
    };
    const synced: CeloAccount = {
      ...senderAccount,
      operations: [{ ...pending(111, "0xs"), blockHeight: 2000 }],
      subAccounts: [{ ...usdcTokenAccount, operations: [], pendingOperations: [replaced] }],
    };

    const result = postSync(current, synced);

    expect(result.subAccounts?.[0].pendingOperations).toEqual([replacement]);
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

const syncWith = (items: unknown[], info: Partial<typeof defaultInfo> = {}) => {
  mockCreateApi.mockReturnValue({
    listOperations: jest.fn().mockResolvedValueOnce({ items }),
    lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
  });
  mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(0));
  mockGetTokenBalance.mockResolvedValue(new BigNumber(5000));
  return getAccountShape({ ...defaultInfo, ...info } as typeof defaultInfo, defaultConfig);
};

describe("fee asset", () => {
  const USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
  const usdtToken = { ticker: "USDT", id: "celo/erc20/usdt", contractAddress: USDT };
  const usdtAccountId = "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:+celo%2Ferc20%2Fusdt";
  const paidInUsdt = (feesPayer: string) => ({
    ...nativeOperation,
    tx: {
      ...nativeOperation.tx,
      fees: BigNumber(1601),
      feesAsset: { type: "erc20", assetReference: USDT },
      feesPayer,
    },
  });
  beforeEach(() => {
    mockTokenEvmLogic.mockReset();
  });

  it("keeps the token that paid the fee, and the fee in its units, without a node lookup", async () => {
    const result = await syncWith([paidInUsdt("0x5a40FEE4eFebE3c85eDD3C79E15e221B7261a000")]);

    expect(result.operations?.[0]).toMatchObject({
      fee: new BigNumber(1601),
      extra: { feeAsset: USDT.toLowerCase() },
    });
    expect(result.subAccounts).toEqual([]);
  });

  it("charges a fee the account paid in a token once, as a FEES operation of that token", async () => {
    // The native operation resolves no token; the fee asset resolves USDT
    mockTokenEvmLogic.mockResolvedValueOnce(undefined).mockResolvedValueOnce(usdtToken);

    const result = await syncWith([paidInUsdt(defaultInfo.address.toLowerCase())]);

    expect(result.subAccounts).toEqual([
      expect.objectContaining({
        id: usdtAccountId,
        balance: new BigNumber(5000),
        operations: [
          expect.objectContaining({
            id: `${usdtAccountId}-0xs-FEES`,
            hash: "0xs",
            type: "FEES",
            value: new BigNumber(1601),
            fee: new BigNumber(1601),
            accountId: usdtAccountId,
            extra: { feeAsset: USDT.toLowerCase() },
          }),
        ],
      }),
    ]);
    expect(result.operations?.[0]).toMatchObject({ type: "OUT", value: new BigNumber(0) });
  });

  it("records no fee operation for a token the crypto-assets store does not know", async () => {
    const result = await syncWith([paidInUsdt(defaultInfo.address)]);

    expect(result.subAccounts).toEqual([]);
  });

  it("keeps a fee paid in CELO as it is", async () => {
    const result = await syncWith([nativeOperation]);

    expect(result.operations?.[0]).toMatchObject({
      fee: new BigNumber(525072996210000),
      extra: {},
    });
  });

  it("keeps the stored history and pending operations of a sub-account rebuilt from scratch", async () => {
    mockTokenEvmLogic.mockResolvedValueOnce({ ticker: "USDC", id: "0xcc" });
    const balanceHistoryCache = { HOUR: {}, DAY: {}, WEEK: {} };
    const pendingOperations = [{ hash: "0xpending" }];
    const tokenAccountId = "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:+0xcc";

    const result = await syncWith([erc20Operation], {
      initialAccount: {
        ...accountFixture,
        syncHash: "0xstale",
        subAccounts: [
          { id: tokenAccountId, token: { ticker: "USDC" }, balanceHistoryCache, pendingOperations },
        ],
      } as unknown as undefined,
    });

    expect(result.subAccounts?.[0]?.balanceHistoryCache).toBe(balanceHistoryCache);
    expect(result.subAccounts?.[0]?.pendingOperations).toBe(pendingOperations);
  });
});
