import BigNumber from "bignumber.js";
import { toJsonSafe } from "@ledgerhq/account-module-framework";
import { defaultTronResources } from "@ledgerhq/coin-tron/resources";
import { toTronResourcesRaw } from "@ledgerhq/coin-tron/types/serialization";
import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { callsOf } from "./fakeCoinModule";
import {
  blockAt,
  coinOperation,
  emptyAccount,
  expectParity,
  freezeTime,
  fromScratch,
  runSyncScenario,
  syncBoth,
  token,
  useTokens,
} from "./harness";

jest.mock("../../api", () => ({ getCoinModuleApi: jest.fn() }));

const OTHER = "someone-else";

const tokenIds = (accounts: TokenAccount[] | undefined) =>
  (accounts ?? []).map(({ token: { id } }) => id);

const TRON_ME = "TMineAddress";
const USDT = token({
  id: "tron/trc20/tusdt",
  parentCurrencyId: "tron",
  contractAddress: "TUsdtContract",
  tokenType: "trc20",
});
const BTT = token({
  id: "tron/trc10/1002000",
  parentCurrencyId: "tron",
  contractAddress: "TBttIssuer",
  tokenType: "trc10",
});
const TRON_SPAM = token({
  id: "tron/trc20/tspam",
  parentCurrencyId: "tron",
  contractAddress: "TSpamContract",
  tokenType: "trc20",
});

const STELLAR_ME = "GMINE";
const USD_ONE = token({
  id: "stellar/asset/USD:GISSUERONE",
  parentCurrencyId: "stellar",
  contractAddress: "GISSUERONE",
  tokenType: "credit_alphanum4",
  tokenIdentifier: "USD",
});
const USD_TWO = token({
  id: "stellar/asset/USD:GISSUERTWO",
  parentCurrencyId: "stellar",
  contractAddress: "GISSUERTWO",
  tokenType: "credit_alphanum4",
  tokenIdentifier: "USD",
});

const STACKS_ME = "SPMINE";
const ALEX = token({
  id: "stacks/sip010/alex",
  parentCurrencyId: "stacks",
  contractAddress: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.Token-Alex::alex",
  tokenType: "sip010",
});

const SOLANA_ME = "SoLMine";
const SPL = token({
  id: "solana/spl/mintone",
  parentCurrencyId: "solana",
  contractAddress: "MintOne",
  tokenType: "spl",
});
const TOKEN_2022 = token({
  id: "solana/spl/minttwo",
  parentCurrencyId: "solana",
  contractAddress: "MintTwo",
  tokenType: "spl",
});

beforeAll(() => {
  freezeTime();
  useTokens([USDT, BTT, TRON_SPAM, USD_ONE, USD_TWO, ALEX, SPL, TOKEN_2022]);
});

afterAll(() => jest.useRealTimers());

afterEach(() => jest.restoreAllMocks());

describe("Tron", () => {
  const usdt = { type: "trc20", assetReference: USDT.contractAddress, assetOwner: TRON_ME };
  const btt = { type: "trc10", assetReference: "1002000", assetOwner: TRON_ME };
  const spam = { type: "trc20", assetReference: TRON_SPAM.contractAddress, assetOwner: TRON_ME };
  const resources = toJsonSafe(
    toTronResourcesRaw({
      ...defaultTronResources,
      tronPower: 5,
      unwithdrawnReward: new BigNumber(3),
    }),
  );
  const operations = [
    coinOperation({
      height: 110,
      type: "OUT",
      value: 1_000n,
      fees: 10n,
      senders: [TRON_ME],
      recipients: [OTHER],
    }),
    // A token transfer the account paid the fee of: a FEES parent.
    coinOperation({
      height: 108,
      type: "OUT",
      value: 40n,
      fees: 15n,
      asset: usdt,
      feesPayer: TRON_ME,
      senders: [TRON_ME],
      recipients: [OTHER],
      details: {
        ledgerOpType: "OUT",
        assetAmount: "40",
        assetSenders: [TRON_ME],
        assetRecipients: [OTHER],
      },
    }),
    // A token transfer a third party paid the fee of: a NONE parent.
    coinOperation({
      height: 107,
      value: 25n,
      fees: 5n,
      asset: usdt,
      feesPayer: OTHER,
      senders: [OTHER],
      recipients: [TRON_ME],
      details: { ledgerOpType: "IN", assetAmount: "25" },
    }),
    // A token OUT without `assetAmount`.
    coinOperation({
      height: 106,
      type: "OUT",
      value: 7n,
      fees: 3n,
      asset: btt,
      feesPayer: TRON_ME,
      senders: [TRON_ME],
      recipients: [OTHER],
      details: { ledgerOpType: "OUT" },
    }),
    // An internal-only transaction.
    coinOperation({
      height: 105,
      value: 300n,
      senders: ["TContract"],
      recipients: [TRON_ME],
      details: { internal: true },
    }),
    // An NFT transfer and a failed incoming one: neither is listed.
    coinOperation({
      height: 104,
      value: 1n,
      recipients: [TRON_ME],
      details: { ledgerOpType: "NFT_IN" },
    }),
    coinOperation({ height: 103, value: 50n, fees: 1n, failed: true, recipients: [TRON_ME] }),
    // A transfer of the blacklisted token.
    coinOperation({
      height: 102,
      value: 9n,
      asset: spam,
      senders: [OTHER],
      recipients: [TRON_ME],
      details: { ledgerOpType: "IN" },
    }),
    // Resource staking: amounts BigNumbers in the family bag.
    coinOperation({
      height: 101,
      type: "FREEZE",
      fees: 1n,
      senders: [TRON_ME],
      details: { familyExtra: { frozenAmount: new BigNumber(1_000_000) } },
    }),
    coinOperation({
      height: 100,
      type: "UNFREEZE",
      fees: 1n,
      senders: [TRON_ME],
      details: { familyExtra: { unfreezeAmount: new BigNumber("1e21") } },
    }),
    coinOperation({
      height: 99,
      type: "UNDELEGATE_RESOURCE",
      fees: 1n,
      senders: [TRON_ME],
      details: { familyExtra: { unDelegatedAmount: new BigNumber(42) } },
    }),
  ];
  const balances: Balance[] = [
    { value: 5_000_000n, asset: { type: "native" } },
    { value: 100n, asset: usdt },
    { value: 50n, asset: btt },
    { value: 9n, asset: spam },
  ];
  const chain = {
    tip: blockAt(112),
    balances,
    operations,
    accountInfo: {
      type: "tron",
      energyLimit: 10,
      energy: 5,
      bandwidth: 600,
      activated: true,
      resources,
    },
  };

  it("syncs the same account on both paths (trc20, trc10, parents, resources)", async () => {
    const [first, second, third] = await runSyncScenario({
      currency: getCryptoCurrencyById("tron"),
      family: "tron",
      account: emptyAccount(getCryptoCurrencyById("tron"), TRON_ME),
      chain,
      // The TRC-10 token swept and gone, the account no longer activated.
      next: {
        ...chain,
        tip: blockAt(130),
        balances: [balances[0], balances[1], balances[3]],
        operations: [
          coinOperation({
            height: 125,
            hash: "confirmed-later",
            type: "OUT",
            value: 5n,
            fees: 1n,
            senders: [TRON_ME],
            recipients: [OTHER],
            details: { sequence: 9 },
          }),
          coinOperation({
            height: 121,
            type: "OUT",
            value: 50n,
            fees: 2n,
            asset: btt,
            feesPayer: TRON_ME,
            senders: [TRON_ME],
            recipients: [OTHER],
            details: { ledgerOpType: "OUT", assetAmount: "50" },
          }),
          ...operations,
        ],
        accountInfo: { type: "tron", activated: false },
      },
      pendingHash: "confirmed-later",
      blacklisted: TRON_SPAM.id,
    });
    expect(tokenIds(first.legacy.subAccounts)).toEqual([USDT.id, BTT.id]);
    expect(first.legacy.operations.map(({ type }) => type)).toEqual([
      "OUT",
      "FEES",
      "NONE",
      "FEES",
      "NONE",
      "NONE",
      "FREEZE",
      "UNFREEZE",
      "UNDELEGATE_RESOURCE",
    ]);
    expect(second.legacy.pendingOperations).toEqual([]);
    expect(second.legacy.subAccounts?.[0].swapHistory).toEqual([{ swapId: "swap" }]);
    // The swept token keeps its account, zeroed.
    expect(tokenIds(third.legacy.subAccounts)).toEqual([USDT.id, TRON_SPAM.id, BTT.id]);
  });
});

describe("Stellar", () => {
  const stellar = getCryptoCurrencyById("stellar");
  const usdOne = { type: "credit_alphanum4", assetReference: "USD", assetOwner: "GISSUERONE" };
  const usdTwo = { type: "credit_alphanum4", assetReference: "USD", assetOwner: "GISSUERTWO" };
  const operations = [
    coinOperation({
      height: 50,
      type: "OUT",
      value: 1_000n,
      fees: 100n,
      senders: [STELLAR_ME],
      recipients: [OTHER],
      memo: { type: "string", kind: "text", value: "hello" },
      details: { memo: "hello", sequence: "41" },
    }),
    coinOperation({
      height: 49,
      value: 30n,
      fees: 100n,
      asset: usdOne,
      senders: [OTHER],
      recipients: [STELLAR_ME],
      feesPayer: OTHER,
      details: { ledgerOpType: "IN", assetAmount: "30" },
    }),
    coinOperation({
      height: 48,
      type: "OUT",
      value: 20n,
      fees: 100n,
      asset: usdTwo,
      senders: [STELLAR_ME],
      recipients: [OTHER],
      feesPayer: STELLAR_ME,
      details: { ledgerOpType: "OUT", assetAmount: "20" },
    }),
    coinOperation({
      height: 47,
      type: "OPT_IN",
      fees: 100n,
      asset: usdTwo,
      senders: [STELLAR_ME],
      feesPayer: STELLAR_ME,
      details: { ledgerOpType: "OPT_IN" },
    }),
  ];
  const balances: Balance[] = [
    { value: 30_000_000n, locked: 15_000_000n, asset: { type: "native" } },
    { value: 500n, asset: usdOne },
    { value: 700n, asset: usdTwo },
  ];

  it("keeps two tokens sharing a code apart on both paths", async () => {
    const [first] = await runSyncScenario({
      currency: stellar,
      family: "stellar",
      account: emptyAccount(stellar, STELLAR_ME),
      chain: { tip: blockAt(51), balances, operations },
      next: {
        tip: blockAt(60),
        balances: [balances[0], balances[2]],
        operations: [
          coinOperation({
            height: 55,
            hash: "stellar-pending",
            type: "OUT",
            value: 10n,
            fees: 100n,
            senders: [STELLAR_ME],
            recipients: [OTHER],
          }),
          ...operations,
        ],
      },
      pendingHash: "stellar-pending",
    });
    expect(tokenIds(first.legacy.subAccounts)).toEqual([USD_ONE.id, USD_TWO.id]);
    expect(first.legacy.subAccounts?.map(({ balance }) => balance.toFixed())).toEqual([
      "500",
      "700",
    ]);
  });
});

describe("Stacks", () => {
  const stacks = getCryptoCurrencyById("stacks");
  const alex = {
    type: "sip010",
    assetReference: ALEX.contractAddress.toLowerCase(),
    assetOwner: STACKS_ME,
  };
  const sendMany = Array.from({ length: 12 }, (_, index) =>
    coinOperation({
      height: 30,
      hash: "send-many",
      id: `send-many-OUT-${index}`,
      type: "OUT",
      value: BigInt(100 + index),
      fees: 5n,
      feesPayer: STACKS_ME,
      senders: [STACKS_ME],
      recipients: [`recipient-${index}`],
      details: { ledgerOpType: "OUT", sequence: 4n, internal: true, memo: `memo-${index}` },
    }),
  );
  const operations = [
    coinOperation({
      height: 30,
      hash: "send-many",
      type: "OUT",
      value: 1_266n,
      fees: 5n,
      feesPayer: STACKS_ME,
      senders: [STACKS_ME],
      details: { ledgerOpType: "OUT", sequence: 4n },
    }),
    ...sendMany,
    coinOperation({
      height: 29,
      value: 70n,
      fees: 5n,
      asset: alex,
      senders: [OTHER],
      recipients: [STACKS_ME],
      feesPayer: OTHER,
      details: { ledgerOpType: "IN", sequence: 2n },
    }),
  ];
  const balances: Balance[] = [
    {
      value: 10_000n,
      locked: 4_000n,
      asset: { type: "native" },
      stake: {
        uid: STACKS_ME,
        address: STACKS_ME,
        delegate: "SPPOOL",
        state: "active",
        actions: ["undelegate"],
        asset: { type: "native" },
        amount: 4_000n,
        details: { unlockHeight: 900, cycles: 3n },
      },
    },
    { value: 70n, asset: alex },
  ];

  it("splits a send-many and keeps the stake of the own balance on both paths", async () => {
    const [first] = await runSyncScenario({
      currency: stacks,
      family: "stacks",
      account: emptyAccount(stacks, STACKS_ME),
      chain: { tip: blockAt(31), balances, operations },
      next: {
        tip: blockAt(40),
        balances,
        operations: [
          coinOperation({
            height: 35,
            hash: "stacks-pending",
            type: "OUT",
            value: 1n,
            fees: 5n,
            feesPayer: STACKS_ME,
            senders: [STACKS_ME],
            recipients: [OTHER],
            details: { ledgerOpType: "OUT", sequence: 9n },
          }),
          ...operations,
        ],
      },
      pendingHash: "stacks-pending",
    });
    expect(first.legacy.operations[0].internalOperations).toHaveLength(12);
    expect(first.legacy.spendableBalance.toFixed()).toBe("6000");
    expect(tokenIds(first.legacy.subAccounts)).toEqual([ALEX.id]);
  });

  it("resumes above the block of the newest operation when a higher block shares its date", async () => {
    // Stacks dates an operation by its Bitcoin burn time, which several Stacks blocks share: by
    // date then id, the newest operation sits in block 30, below block 31.
    const burnTime = blockAt(31).time;
    const received = (hash: string, height: number) =>
      coinOperation({
        height,
        hash,
        date: burnTime,
        value: 10n,
        senders: [OTHER],
        recipients: [STACKS_ME],
      });
    const native: Balance[] = [{ value: 10_000n, asset: { type: "native" } }];
    const base = { currency: stacks, family: "stacks" };

    const first = await syncBoth(
      {
        ...base,
        chain: {
          tip: blockAt(31),
          balances: native,
          operations: [received("a", 30), received("b", 31)],
        },
      },
      fromScratch(emptyAccount(stacks, STACKS_ME)),
    );
    expectParity(first);
    expect(first.legacy.operations.map(({ hash, blockHeight }) => [hash, blockHeight])).toEqual([
      ["a", 30],
      ["b", 31],
    ]);

    // Block 31 gains an operation its indexer reported late.
    const next = {
      tip: blockAt(32),
      balances: native,
      operations: [received("a", 30), received("b", 31), received("c", 31)],
    };
    const second = await syncBoth({ ...base, chain: next }, first);
    expectParity(second);
    expect(callsOf(second.portfolioModule.listOperations)).toEqual([
      [STACKS_ME, { minHeight: 31, order: "desc" }],
    ]);
    expect(second.portfolio.operations.map(({ hash }) => hash).sort()).toEqual(["a", "b", "c"]);
    expect(second.portfolio.operationsCount).toBe(3);
  });
});

describe("Solana tokens", () => {
  const solana = getCryptoCurrencyById("solana");
  const spl: AssetInfo = { type: "spl", assetReference: "MintOne", assetOwner: SOLANA_ME };
  const token2022: AssetInfo = { type: "spl", assetReference: "MintTwo", assetOwner: SOLANA_ME };
  const operations = [
    coinOperation({
      height: 300,
      value: 9n,
      fees: 5_000n,
      asset: token2022,
      senders: [OTHER],
      recipients: [SOLANA_ME],
      feesPayer: OTHER,
      details: { ledgerOpType: "IN", assetAmount: "9" },
    }),
    coinOperation({
      height: 299,
      type: "OUT",
      value: 3n,
      fees: 5_000n,
      asset: spl,
      senders: [SOLANA_ME],
      recipients: [OTHER],
      feesPayer: SOLANA_ME,
      details: { ledgerOpType: "OUT", assetAmount: "3" },
    }),
  ];
  const chain = {
    tip: blockAt(301),
    balances: [
      { value: 2_000_000n, locked: 890_880n, asset: { type: "native" } },
      { value: 10n, asset: spl },
      { value: 9n, asset: token2022 },
    ],
    operations,
    accountInfo: {
      type: "solana",
      tokenAccounts: {
        MintOne: { state: "initialized" },
        MintTwo: { state: "frozen", extensions: { transferFee: { feeBps: 50, maxFee: "10" } } },
      },
    },
  };

  it("gives the token accounts their family fields on both paths", async () => {
    const [first] = await runSyncScenario({
      currency: solana,
      family: "solana",
      account: emptyAccount(solana, SOLANA_ME),
      chain,
      next: {
        ...chain,
        tip: blockAt(320),
        operations: [
          coinOperation({
            height: 310,
            hash: "solana-pending",
            type: "OUT",
            value: 1n,
            fees: 5_000n,
            senders: [SOLANA_ME],
            recipients: [OTHER],
          }),
          ...operations,
        ],
        accountInfoError: new Error("token accounts unreadable"),
      },
      pendingHash: "solana-pending",
    });
    expect(first.legacy.subAccounts?.[1]).toMatchObject({
      state: "frozen",
      extensions: { transferFee: { feeBps: 50 } },
    });
  });
});
