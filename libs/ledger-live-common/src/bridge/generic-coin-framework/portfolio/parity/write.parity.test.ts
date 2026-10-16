import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import { getGasTracker, getNodeApi } from "@ledgerhq/coin-evm/network";
import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { NotEnoughBalance } from "@ledgerhq/coin-module-framework/errors";
import type {
  Account,
  AccountLike,
  BroadcastConfig,
  SignedOperation,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getEditTransactionPatch } from "../../../../families/evm/editTransaction/getEditTransactionPatch";
import { getCoinFrameworkAccountBridge } from "../../accountBridge";
import type { GenericTransaction } from "../../types";
import { callsOf, type FakeChain, type FakeCoinModule } from "./fakeCoinModule";
import {
  blockAt,
  coinOperation,
  configure,
  describeStatus,
  emptyAccount,
  fakeSigner,
  freezeTime,
  FROZEN_NOW,
  normalise,
  serveChain,
  signedEvmTransaction,
  syncAccount,
  token,
  useTokens,
  type Path,
} from "./harness";

jest.mock("../../api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("@ledgerhq/coin-evm/network", () => ({
  ...jest.requireActual("@ledgerhq/coin-evm/network"),
  getGasTracker: jest.fn(),
  getNodeApi: jest.fn(),
}));

const OTHER = "someone-else";
const native = { type: "native" } as const;

/** The coin module methods a write calls, compared across paths. */
const WRITE_METHODS = [
  "estimateFees",
  "validateIntent",
  "craftTransaction",
  "craftTransactionData",
  "craftRawTransaction",
  "combine",
  "broadcast",
  "getNextSequence",
] as const;

type WriteCase = {
  currency: CryptoCurrency;
  family: string;
  chain: FakeChain;
  account: Account;
  transaction: GenericTransaction;
  coinConfig?: object;
  /**
   * The account a send-max is estimated for: a token account, or the account itself; none for a
   * family whose transaction the generic bridge cannot create (Celo).
   */
  maxOf?: (account: Account) => AccountLike | null;
  broadcastConfig?: BroadcastConfig;
};

/** Every write entry point of the account bridge on `path`, and what the coin module received. */
async function writeOn(path: Path, write: WriteCase) {
  const { currency, family, chain, account, transaction, coinConfig, broadcastConfig } = write;
  configure(currency, path, { coinConfig });
  const module = serveChain(chain);
  const bridge = await getCoinFrameworkAccountBridge(family, "local", fakeSigner);

  const prepared = await bridge.prepareTransaction(account, transaction);
  const status = await bridge.getTransactionStatus(account, prepared);
  const maxOf = write.maxOf ? write.maxOf(account) : account;
  const max =
    maxOf &&
    (await bridge.estimateMaxSpendable({
      account: maxOf,
      parentAccount: maxOf === account ? null : account,
      transaction: prepared,
    }));
  const events = await lastValueFrom(
    bridge
      .signOperation({ account, transaction: prepared, deviceId: "device" })
      .pipe(toArray<SignOperationEvent>()),
  );
  const signed = events.find(
    (event): event is { type: "signed"; signedOperation: SignedOperation } =>
      event.type === "signed",
  )?.signedOperation;
  if (!signed) throw new Error("not signed");
  const broadcasted = await bridge.broadcast({
    account,
    signedOperation: signed,
    broadcastConfig: broadcastConfig ?? { mevProtected: true },
  });

  return {
    module,
    outputs: {
      prepared: normalise(prepared),
      status: describeStatus(status),
      max: normalise(max),
      events: normalise(events.map(({ type }) => type)),
      signed: normalise(signed),
      broadcasted: normalise(broadcasted),
    },
  };
}

/**
 * What a coin module method received, without the context and with undefined keys dropped.
 *
 * The data of an intent is crafted when the side writing gets it: on the legacy path, before the
 * device key and the sequence of a signature are known (`transactionToIntent`); on the portfolio
 * path, when the account module crafts the transaction, with them. So `craftTransactionData` is
 * compared without those two fields, which no coin module's `craftTransactionData` reads.
 */
const received = (module: FakeCoinModule) =>
  Object.fromEntries(
    WRITE_METHODS.map(name => {
      const calls = callsOf(module[name] as jest.Mock);
      return [
        name,
        normalise(
          name === "craftTransactionData"
            ? calls.map(([intent]) => {
                const {
                  senderPublicKey: _key,
                  sequence: _sequence,
                  ...rest
                } = intent as Record<string, unknown>;
                return [rest];
              })
            : calls,
        ),
      ];
    }),
  );

/** The same write on the legacy path and the local portfolio path: equal outputs, equal calls. */
async function expectWriteParity(write: WriteCase) {
  const legacy = await writeOn("legacy", write);
  const local = await writeOn("local", write);
  expect(received(local.module)).toEqual(received(legacy.module));
  expect(local.outputs).toEqual(legacy.outputs);
  return { legacy, local };
}

/** An account of `currency` synced on the legacy path from `chain`. */
async function synced(
  currency: CryptoCurrency,
  family: string,
  chain: FakeChain,
  address: string,
  options: Parameters<typeof emptyAccount>[2] = {},
  coinConfig?: object,
): Promise<Account> {
  configure(currency, "legacy", { coinConfig });
  serveChain(chain);
  return syncAccount(family, emptyAccount(currency, address, options));
}

const subAccountOf = (account: Account, tokenId: string) => {
  const sub = account.subAccounts?.find(({ token: { id } }) => id === tokenId);
  if (!sub) throw new Error(`no ${tokenId} account`);
  return sub;
};

/** A pending send of the account, its sequence and amounts locked until it confirms. */
const withPendingSend = (account: Account, sequence: number): Account => ({
  ...account,
  pendingOperations: [
    {
      id: `${account.id}-pending-send-OUT`,
      hash: "pending-send",
      type: "OUT",
      value: new BigNumber(50),
      fee: new BigNumber(12),
      senders: [account.freshAddress],
      recipients: [OTHER],
      blockHeight: null,
      blockHash: null,
      accountId: account.id,
      date: new Date(FROZEN_NOW.getTime() - 60_000),
      transactionSequenceNumber: new BigNumber(sequence),
      extra: {},
    },
  ],
});

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
const USD_ONE = token({
  id: "stellar/asset/USD:GISSUERONE",
  parentCurrencyId: "stellar",
  contractAddress: "GISSUERONE",
  tokenType: "credit_alphanum4",
  tokenIdentifier: "USD",
});
const HTS = token({
  id: "hedera/hts/0.0.789",
  parentCurrencyId: "hedera",
  contractAddress: "0.0.789",
  tokenType: "hts",
});
// CAL keeps a Cardano token's policy id as its contract address and its asset name as its token
// identifier; the reference the chain uses joins them, as the token id does.
const HOSKY_POLICY_ID = "a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235";
const HOSKY_ASSET_NAME = "484f534b59";
const HOSKY_REFERENCE = `${HOSKY_POLICY_ID}${HOSKY_ASSET_NAME}`;
const HOSKY = token({
  id: `cardano/native/${HOSKY_REFERENCE}`,
  parentCurrencyId: "cardano",
  contractAddress: HOSKY_POLICY_ID,
  tokenIdentifier: HOSKY_ASSET_NAME,
  tokenType: "native",
});
const USDC = token({
  id: "ethereum/erc20/usd__coin",
  parentCurrencyId: "ethereum",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  tokenType: "erc20",
});

beforeAll(() => {
  freezeTime();
  useTokens([USDT, BTT, USD_ONE, HTS, HOSKY, USDC]);
});

afterAll(() => jest.useRealTimers());

beforeEach(() => {
  // The node knows no transaction of the scenarios (the EVM broadcast pre-check of the legacy path).
  jest.mocked(getNodeApi).mockReturnValue({
    getTransaction: async () => {
      throw Object.assign(new Error("not found"), { name: "LedgerAPI4xx", status: 404 });
    },
  } as never);
});

afterEach(() => jest.restoreAllMocks());

describe("write parity: native and send-max", () => {
  const ripple = getCryptoCurrencyById("ripple");
  const ME = "rMine";
  const chain: FakeChain = {
    tip: blockAt(10),
    balances: [{ value: 30_000_000n, locked: 10_000_000n, asset: native }],
    operations: [
      coinOperation({ height: 9, value: 30_000_000n, senders: [OTHER], recipients: [ME] }),
    ],
    nextSequence: 4n,
  };

  it("sends the native asset the same way", async () => {
    const account = await synced(ripple, "xrp", chain, ME);
    await expectWriteParity({
      currency: ripple,
      family: "xrp",
      chain,
      account,
      transaction: {
        family: "xrp",
        amount: new BigNumber(1_000),
        recipient: OTHER,
        fees: null,
        tag: 7,
      } as GenericTransaction,
    });
  });

  it("sends the max with a pending send locked, the same way", async () => {
    const account = withPendingSend(await synced(ripple, "xrp", chain, ME), 5);
    const { legacy } = await expectWriteParity({
      currency: ripple,
      family: "xrp",
      chain,
      account,
      transaction: {
        family: "xrp",
        amount: new BigNumber(0),
        useAllAmount: true,
        recipient: OTHER,
        fees: null,
      } as GenericTransaction,
    });
    // The nonce step went over the pending send.
    expect(legacy.outputs.signed).toMatchObject({
      operation: { transactionSequenceNumber: "BN:6" },
    });
  });

  it("answers the coin module's validation errors as the same classes", async () => {
    const account = await synced(ripple, "xrp", chain, ME);
    const refusing: FakeChain = {
      ...chain,
      validate: (intent: TransactionIntent<any, any>, balances: Balance[]) => ({
        errors: { amount: Object.assign(new NotEnoughBalance(), { links: ["ledgerlive://buy"] }) },
        warnings: {},
        estimatedFees: 12n,
        amount: intent.amount,
        totalSpent: intent.amount + 12n + BigInt(balances.length),
      }),
    };
    const legacy = await writeOn("legacy", {
      currency: ripple,
      family: "xrp",
      chain: refusing,
      account,
      transaction: {
        family: "xrp",
        amount: new BigNumber(99),
        recipient: OTHER,
      } as GenericTransaction,
    });
    const local = await writeOn("local", {
      currency: ripple,
      family: "xrp",
      chain: refusing,
      account,
      transaction: {
        family: "xrp",
        amount: new BigNumber(99),
        recipient: OTHER,
      } as GenericTransaction,
    });
    expect(local.outputs.status).toEqual(legacy.outputs.status);
    expect(legacy.outputs.status.errors.amount.constructor).toBe(NotEnoughBalance);
  });
});

describe("write parity: tokens", () => {
  it.each([
    ["TRC-20", USDT, { type: "trc20", assetReference: USDT.contractAddress }],
    ["TRC-10", BTT, { type: "trc10", assetReference: "1002000" }],
  ])("sends a %s token the same way", async (_name, tronToken, asset) => {
    const tron = getCryptoCurrencyById("tron");
    const ME = "TMineAddress";
    const held = { ...asset, assetOwner: ME };
    const chain: FakeChain = {
      tip: blockAt(20),
      balances: [
        { value: 5_000_000n, asset: native },
        { value: 100n, asset: held },
      ],
      operations: [
        coinOperation({
          height: 19,
          value: 100n,
          asset: held,
          senders: [OTHER],
          recipients: [ME],
          details: { ledgerOpType: "IN" },
        }),
      ],
      estimate: () => ({ value: 345n, parameters: { feeLimit: 10_000_000n, energy: 13n } }),
    };
    const account = await synced(tron, "tron", chain, ME);
    const sub = subAccountOf(account, tronToken.id);
    await expectWriteParity({
      currency: tron,
      family: "tron",
      chain,
      account,
      maxOf: () => sub,
      transaction: {
        family: "tron",
        amount: new BigNumber(40),
        recipient: OTHER,
        subAccountId: sub.id,
        fees: null,
      } as GenericTransaction,
    });
  });

  it("sends a Stellar token with a memo the same way", async () => {
    const stellar = getCryptoCurrencyById("stellar");
    const ME = "GMINE";
    const usd = { type: "credit_alphanum4", assetReference: "USD", assetOwner: "GISSUERONE" };
    const chain: FakeChain = {
      tip: blockAt(30),
      balances: [
        { value: 30_000_000n, locked: 15_000_000n, asset: native },
        { value: 500n, asset: usd },
      ],
      operations: [
        coinOperation({
          height: 29,
          value: 500n,
          asset: usd,
          senders: [OTHER],
          recipients: [ME],
          details: { ledgerOpType: "IN" },
        }),
      ],
    };
    const account = await synced(stellar, "stellar", chain, ME);
    const sub = subAccountOf(account, USD_ONE.id);
    await expectWriteParity({
      currency: stellar,
      family: "stellar",
      chain,
      account,
      maxOf: () => sub,
      transaction: {
        family: "stellar",
        amount: new BigNumber(20),
        recipient: OTHER,
        subAccountId: sub.id,
        memoType: "MEMO_TEXT",
        memoValue: "invoice-42",
        fees: null,
      } as GenericTransaction,
    });
  });

  it("associates a Hedera token the account does not hold the same way", async () => {
    const hedera = getCryptoCurrencyById("hedera");
    const ME = "0.0.1234";
    const chain: FakeChain = {
      tip: blockAt(40),
      balances: [{ value: 10_000n, asset: native }],
      operations: [
        coinOperation({ height: 39, value: 10_000n, senders: [OTHER], recipients: [ME] }),
      ],
      accountInfo: { type: "hedera", stakedNodeId: -1, balance: "10000", pendingReward: "0" },
    };
    const account = await synced(hedera, "hedera", chain, ME, { derivationMode: "hederaBip44" });
    await expectWriteParity({
      currency: hedera,
      family: "hedera",
      chain,
      account,
      transaction: {
        family: "hedera",
        mode: "tokenAssociate",
        amount: new BigNumber(0),
        recipient: "",
        assetReference: HTS.contractAddress,
        assetOwner: ME,
        fees: null,
      } as unknown as GenericTransaction,
    });
  });

  it("sends a Cardano token, of CAL type native, the same way", async () => {
    const cardano = getCryptoCurrencyById("cardano");
    const ME = "addr1mine";
    const hosky = { type: "token", assetReference: HOSKY_REFERENCE, assetOwner: ME };
    const chain: FakeChain = {
      tip: blockAt(50),
      balances: [
        { value: 5_000_000n, asset: native },
        { value: 1_000n, asset: hosky },
      ],
      operations: [
        coinOperation({
          height: 49,
          value: 1_000n,
          asset: hosky,
          senders: [OTHER],
          recipients: [ME],
          details: { ledgerOpType: "IN" },
        }),
      ],
    };
    const account = await synced(cardano, "cardano", chain, ME);
    const sub = subAccountOf(account, HOSKY.id);
    await expectWriteParity({
      currency: cardano,
      family: "cardano",
      chain,
      account,
      maxOf: () => sub,
      transaction: {
        family: "cardano",
        amount: new BigNumber(10),
        recipient: OTHER,
        subAccountId: sub.id,
        fees: null,
      } as GenericTransaction,
    });
  });

  it("sends an ERC-20 token, its data completed by the writer, the same way", async () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const ME = "0x1111111111111111111111111111111111111111";
    const usdc = { type: "erc20", assetReference: USDC.contractAddress, assetOwner: ME };
    const chain: FakeChain = {
      tip: blockAt(60),
      balances: [
        { value: 10n ** 18n, asset: native },
        { value: 5_000_000n, asset: usdc },
      ],
      operations: [
        coinOperation({
          height: 59,
          value: 5_000_000n,
          asset: usdc,
          senders: [OTHER],
          recipients: [ME],
          details: { ledgerOpType: "IN" },
        }),
      ],
      combine: signedEvmTransaction,
      craftData: intent =>
        intent.asset.type === "native"
          ? { type: "none" }
          : { type: "buffer", value: Buffer.from(`transfer:${intent.recipient}:${intent.amount}`) },
      estimate: () => ({
        value: 21_000n * 30n,
        parameters: { gasPrice: 30n, gasLimit: 65_000n, type: 0 },
      }),
    };
    const account = await synced(ethereum, "evm", chain, ME);
    const sub = subAccountOf(account, USDC.id);
    const { legacy } = await expectWriteParity({
      currency: ethereum,
      family: "evm",
      chain,
      account,
      maxOf: () => sub,
      transaction: {
        family: "evm",
        mode: "send",
        type: 0,
        amount: new BigNumber(1_000),
        recipient: "0x2222222222222222222222222222222222222222",
        subAccountId: sub.id,
        fees: null,
        gasPrice: null,
        gasLimit: new BigNumber(0),
      } as unknown as GenericTransaction,
    });
    expect(legacy.module.craftTransactionData).toHaveBeenCalled();
  });
});

describe("write parity: staking", () => {
  it("stakes on NEAR the same way", async () => {
    const near = getCryptoCurrencyById("near");
    const ME = "mine.near";
    const chain: FakeChain = {
      tip: blockAt(70),
      balances: [{ value: 10n ** 25n, locked: 10n ** 22n, asset: native }],
      operations: [
        coinOperation({ height: 69, value: 10n ** 25n, senders: [OTHER], recipients: [ME] }),
      ],
    };
    const account = await synced(near, "near", chain, ME);
    await expectWriteParity({
      currency: near,
      family: "near",
      chain,
      account,
      transaction: {
        family: "near",
        mode: "stake",
        amount: new BigNumber("1e24"),
        recipient: "validator.poolv1.near",
        fees: null,
      } as unknown as GenericTransaction,
    });
  });

  it("creates a Solana stake account the same way", async () => {
    const solana = getCryptoCurrencyById("solana");
    const ME = "SoLMine";
    const chain: FakeChain = {
      tip: blockAt(80),
      balances: [{ value: 5_000_000_000n, locked: 890_880n, asset: native }],
      operations: [
        coinOperation({ height: 79, value: 5_000_000_000n, senders: [OTHER], recipients: [ME] }),
      ],
      validators: [{ id: "Vote111", address: "Vote111", name: "Vote 111" }],
      estimate: () => ({ value: 5_000n, parameters: { stakeAccountRent: 2_282_880n } }),
    };
    const account = await synced(solana, "solana", chain, ME);
    await expectWriteParity({
      currency: solana,
      family: "solana",
      chain,
      account,
      transaction: {
        family: "solana",
        mode: "stake",
        amount: new BigNumber(1_000_000_000),
        recipient: "Vote111",
        valAddress: "Vote111",
        familySpecificData: { stakeAccountSeed: "stake:0.1" },
        fees: null,
      } as unknown as GenericTransaction,
    });
  });

  it("sends a Solana transaction carrying bytes the same way", async () => {
    const solana = getCryptoCurrencyById("solana");
    const ME = "SoLMine";
    const chain: FakeChain = {
      tip: blockAt(80),
      balances: [{ value: 5_000_000_000n, locked: 890_880n, asset: native }],
      operations: [
        coinOperation({ height: 79, value: 5_000_000_000n, senders: [OTHER], recipients: [ME] }),
      ],
    };
    const account = await synced(solana, "solana", chain, ME);
    await expectWriteParity({
      currency: solana,
      family: "solana",
      chain,
      account,
      transaction: {
        family: "solana",
        amount: new BigNumber(1),
        recipient: OTHER,
        raw: Buffer.from("instruction-bytes").toString("base64"),
        fees: null,
      } as unknown as GenericTransaction,
    });
  });

  it("redelegates on Cosmos the same way", async () => {
    const cosmos = getCryptoCurrencyById("cosmos");
    const ME = "cosmos1mine";
    const chain: FakeChain = {
      tip: blockAt(90),
      balances: [
        { value: 1_000_000n, asset: native },
        {
          value: 500n,
          asset: native,
          stake: {
            uid: `${ME}-cosmosvaloper1a`,
            address: ME,
            delegate: "cosmosvaloper1a",
            state: "active",
            actions: ["redelegate"],
            asset: native,
            amount: 500n,
          },
        },
      ],
      operations: [
        coinOperation({ height: 89, value: 1_000_500n, senders: [OTHER], recipients: [ME] }),
      ],
      validators: [{ id: "cosmosvaloper1a", address: "cosmosvaloper1a", name: "A" }],
      accountInfo: { type: "cosmos", redelegations: [] },
    };
    const account = await synced(cosmos, "cosmos", chain, ME);
    await expectWriteParity({
      currency: cosmos,
      family: "cosmos",
      chain,
      account,
      transaction: {
        family: "cosmos",
        mode: "redelegate",
        amount: new BigNumber(100),
        recipient: "",
        valAddress: "cosmosvaloper1a",
        dstValAddress: "cosmosvaloper1b",
        memoValue: "moving",
        fees: null,
      } as unknown as GenericTransaction,
    });
  });

  it("votes on Celo with the exact validator group the same way", async () => {
    const celo = getCryptoCurrencyById("celo");
    const ME = "0x00000000000000000000000000000000000ce10a";
    const chain: FakeChain = {
      tip: blockAt(100),
      balances: [{ value: 10n ** 19n, locked: 10n ** 18n, asset: native }],
      operations: [
        coinOperation({ height: 99, value: 10n ** 19n, senders: [OTHER], recipients: [ME] }),
      ],
    };
    const account = await synced(celo, "celo", chain, ME);
    await expectWriteParity({
      currency: celo,
      family: "celo",
      chain,
      account,
      maxOf: () => null,
      transaction: {
        family: "celo",
        mode: "vote",
        amount: new BigNumber("1e17"),
        recipient: "0x00000000000000000000000000000000000600d1",
        valAddress: "0x00000000000000000000000000000000000600d1",
        fees: null,
      } as unknown as GenericTransaction,
    });
  });
});

describe("write parity: raw signing and the EVM edit patch", () => {
  it("signs a raw Solana transaction the same way", async () => {
    const solana = getCryptoCurrencyById("solana");
    const ME = "SoLMine";
    const chain: FakeChain = {
      tip: blockAt(80),
      balances: [{ value: 5_000_000_000n, asset: native }],
      operations: [
        coinOperation({ height: 79, value: 5_000_000_000n, senders: [OTHER], recipients: [ME] }),
      ],
      nextSequence: 3n,
    };
    const account = await synced(solana, "solana", chain, ME);
    const signRaw = async (path: Path) => {
      configure(solana, path);
      const module = serveChain(chain);
      const bridge = await getCoinFrameworkAccountBridge("solana", "local", fakeSigner);
      const events = await lastValueFrom(
        bridge.signRawOperation!({
          account,
          transaction: "dapp-transaction",
          deviceId: "device",
        }).pipe(toArray<SignOperationEvent>()),
      );
      return { module, events: normalise(events) };
    };
    const legacy = await signRaw("legacy");
    const local = await signRaw("local");
    expect(received(local.module)).toEqual(received(legacy.module));
    expect(local.events).toEqual(legacy.events);
    expect(callsOf(legacy.module.craftRawTransaction)).toEqual([
      ["dapp-transaction", ME, "device-public-key", 3n],
    ]);
  });

  it("patches an EVM transaction with the gas tracker's options the same way", async () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const ME = "0x1111111111111111111111111111111111111111";
    const gasOptions = {
      slow: {
        maxFeePerGas: new BigNumber(10),
        maxPriorityFeePerGas: new BigNumber(1),
        gasPrice: null,
        nextBaseFee: new BigNumber(9),
      },
      medium: {
        maxFeePerGas: new BigNumber(20),
        maxPriorityFeePerGas: new BigNumber(2),
        gasPrice: null,
        nextBaseFee: new BigNumber(9),
      },
      fast: {
        maxFeePerGas: new BigNumber(30),
        maxPriorityFeePerGas: new BigNumber(3),
        gasPrice: null,
        nextBaseFee: new BigNumber(9),
      },
    };
    jest.mocked(getGasTracker).mockReturnValue({
      getGasOptions: jest.fn(async () => gasOptions),
    } as never);
    const chain: FakeChain = {
      tip: blockAt(60),
      balances: [{ value: 10n ** 18n, asset: native }],
      operations: [
        coinOperation({ height: 59, value: 10n ** 18n, senders: [OTHER], recipients: [ME] }),
      ],
      // coin-evm answers the gas tracker's options in its estimate parameters.
      estimate: () => ({
        value: 21_000n * 30n,
        parameters: {
          gasOptions: {
            slow: { maxFeePerGas: 10n, maxPriorityFeePerGas: 1n, gasPrice: null, nextBaseFee: 9n },
            medium: {
              maxFeePerGas: 20n,
              maxPriorityFeePerGas: 2n,
              gasPrice: null,
              nextBaseFee: 9n,
            },
            fast: { maxFeePerGas: 30n, maxPriorityFeePerGas: 3n, gasPrice: null, nextBaseFee: 9n },
          },
        },
      }),
    };
    const coinConfig = { gasTracker: { type: "ledger", explorerId: "eth" } };
    const account = await synced(ethereum, "evm", chain, ME, {}, coinConfig);
    const edited = {
      family: "evm",
      mode: "send",
      type: 2,
      amount: new BigNumber(5),
      recipient: OTHER,
      nonce: 4,
      gasLimit: new BigNumber(21_000),
      maxFeePerGas: new BigNumber(12),
      maxPriorityFeePerGas: new BigNumber(1),
    } as never;
    const patchOn = async (path: Path) => {
      configure(ethereum, path, { coinConfig });
      serveChain(chain);
      return normalise({
        speedup: await getEditTransactionPatch({
          editType: "speedup",
          transaction: edited,
          account,
        }),
        cancel: await getEditTransactionPatch({ editType: "cancel", transaction: edited, account }),
      });
    };
    const legacy = await patchOn("legacy");
    expect(await patchOn("local")).toEqual(legacy);
    expect(legacy).toMatchObject({ speedup: { maxFeePerGas: "BN:30", feesStrategy: "fast" } });
  });
});
