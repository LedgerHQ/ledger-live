import { Keypair } from "@solana/web3.js";
import type {
  Balance,
  MemoNotSupported,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import { InvalidAddress, NotEnoughBalance, NotEnoughGas } from "@ledgerhq/errors";
import { getChainAPI } from "../../network";
import type { ChainAPI } from "../../network";
import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import { endpointByCurrencyId } from "../../utils";
import { validateIntent as validateIntentRaw } from "../validateIntent";

const api = getChainAPI({ endpoint: endpointByCurrencyId("solana") });

const validateIntent = (
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  balances: Balance[],
  customFees: FeeEstimation | undefined,
  chainApi: ChainAPI,
) => validateIntentRaw(chainApi, intent, balances, customFees);

const VIBECODOOR_MINT = "Aj1mSpD4vJDN5r3xptnHsjHQgGWDLge8bRQi2W6pump";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const CIRCLE_WALLET = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";
const SENDER = "8DpKDisipx6f76cEmuGvCX9TrA3SjeR76HaTRePxHBDe";

const NETWORK_FEE = 5_000n;
const MAIN_ACCOUNT_RENT_EXEMPT = 890_880n;

// Exact reproducer from the bug report: native = 0.00293516 SOL, spendable
// (value - locked) = 0.00204428 SOL = classic 165-byte ATA rent + network fee.
const BALANCE_AT_BUG_THRESHOLD = 2_044_280n + MAIN_ACCOUNT_RENT_EXEMPT;
const SPL_BALANCE = 10_000_000n;

function makeNativeBalance(value: bigint, locked: bigint = MAIN_ACCOUNT_RENT_EXEMPT): Balance {
  return { value, asset: { type: "native" }, locked };
}

function makeTokenBalance(mint: string, value: bigint = SPL_BALANCE): Balance {
  return {
    value,
    asset: { type: "spl-token", assetReference: mint } as unknown as Balance["asset"],
  };
}

function makeTokenIntent(
  mint: string,
  overrides: Partial<TransactionIntent<StringMemo | MemoNotSupported>> = {},
): TransactionIntent<StringMemo | MemoNotSupported> {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: Keypair.generate().publicKey.toBase58(),
    amount: 1n,
    asset: {
      type: "spl-token",
      assetReference: mint,
      name: "Token",
    } as unknown as TransactionIntent["asset"],
    ...overrides,
  };
}

describe("validateIntent (integration)", () => {
  jest.setTimeout(30_000);

  describe("SPL Token-2022 transfer to recipient without ATA", () => {
    it("packs NotEnoughGas when spendable balance equals classic ATA rent + fee (the regression scenario)", async () => {
      const result = await validateIntent(
        makeTokenIntent(VIBECODOOR_MINT),
        [makeNativeBalance(BALANCE_AT_BUG_THRESHOLD), makeTokenBalance(VIBECODOOR_MINT)],
        { value: NETWORK_FEE },
        api,
      );

      expect(result.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
      const fees = (result.errors.gasPrice as Error & { fees?: string }).fees;
      expect(BigInt(fees ?? "0")).toBeGreaterThan(2_044_280n);
    });

    it("does not pack NotEnoughGas when spendable balance comfortably covers mint-aware ATA rent + fee", async () => {
      const result = await validateIntent(
        makeTokenIntent(VIBECODOOR_MINT),
        [makeNativeBalance(1_000_000_000n), makeTokenBalance(VIBECODOOR_MINT)],
        { value: NETWORK_FEE },
        api,
      );

      expect(result.errors.gasPrice).toBeUndefined();
    });

    it("packs NotEnoughGas when spendable is zero, regardless of fee value", async () => {
      const result = await validateIntent(
        makeTokenIntent(VIBECODOOR_MINT),
        [makeNativeBalance(MAIN_ACCOUNT_RENT_EXEMPT), makeTokenBalance(VIBECODOOR_MINT)],
        { value: 0n },
        api,
      );

      expect(result.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
    });
  });

  describe("SPL Token transfer to a recipient that already has the ATA", () => {
    it("does not reserve ATA rent — the existing ATA covers it (USDC → Circle)", async () => {
      const result = await validateIntent(
        makeTokenIntent(USDC_MINT, { recipient: CIRCLE_WALLET }),
        [makeNativeBalance(NETWORK_FEE + MAIN_ACCOUNT_RENT_EXEMPT), makeTokenBalance(USDC_MINT)],
        { value: NETWORK_FEE },
        api,
      );

      expect(result.errors.gasPrice).toBeUndefined();
    });
  });

  describe("native transfer validation still applies", () => {
    it("flags InvalidAddress when the recipient is not a valid Solana address", async () => {
      const result = await validateIntent(
        {
          intentType: "transaction",
          type: "send",
          sender: SENDER,
          recipient: "not-a-base58-address!!!",
          amount: 1n,
          asset: { type: "native", name: "Solana" } as TransactionIntent["asset"],
        },
        [makeNativeBalance(1_000_000_000n)],
        { value: NETWORK_FEE },
        api,
      );

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("flags NotEnoughBalance for a native transfer that exceeds available SOL", async () => {
      const result = await validateIntent(
        {
          intentType: "transaction",
          type: "send",
          sender: SENDER,
          recipient: Keypair.generate().publicKey.toBase58(),
          amount: 10_000_000_000n,
          asset: { type: "native", name: "Solana" } as TransactionIntent["asset"],
        },
        [makeNativeBalance(1_000_000_000n + MAIN_ACCOUNT_RENT_EXEMPT)],
        { value: NETWORK_FEE },
        api,
      );

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });
});
