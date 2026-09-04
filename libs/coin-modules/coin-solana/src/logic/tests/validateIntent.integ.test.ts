import { Keypair } from "@solana/web3.js";
import type {
  Balance,
  MemoNotSupported,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import { InvalidAddress, NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { NotEnoughGas } from "../../errors";
import { getChainAPI } from "../../network";
import type { ChainAPI } from "../../network";
import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import { endpointByCurrencyId } from "../../utils";
import { estimateFees } from "../estimateFees";
import { validateIntent as validateIntentRaw } from "../validateIntent";
import type { SolanaCoinConfig } from "../../config";

const config: SolanaCoinConfig = {
  token2022Enabled: false,
  legacyOCMSMaxVersion: "1.0.0",
  status: { type: "active" },
};
const api = getChainAPI({ endpoint: endpointByCurrencyId(config, "solana") });

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
const CLASSIC_ATA_SIZE = 165;

// The reproducer from the bug report: spendable is exactly what a classic 165-byte token account
// costs, plus the fee -- and a Token-2022 one costs more. Read from the chain rather than pinned:
// Solana has lowered the rent-exempt minimum since, and a pinned figure stops reproducing anything.
async function balanceAtBugThreshold(): Promise<bigint> {
  const classicAtaRent = BigInt(await api.getMinimumBalanceForRentExemption(CLASSIC_ATA_SIZE));
  return classicAtaRent + NETWORK_FEE + MAIN_ACCOUNT_RENT_EXEMPT;
}
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
    // The rent is sized from the mint by `estimateFees`, whose result `prepareTransaction` puts on
    // the transaction -- so the chain under test is estimate-then-validate, not validate alone.
    it("packs NotEnoughGas when spendable balance equals classic ATA rent + fee (the regression scenario)", async () => {
      const intent = makeTokenIntent(VIBECODOOR_MINT);
      const estimation = await estimateFees(api, intent);
      const classicAtaRent = BigInt(await api.getMinimumBalanceForRentExemption(CLASSIC_ATA_SIZE));

      const result = await validateIntent(
        intent,
        [makeNativeBalance(await balanceAtBugThreshold()), makeTokenBalance(VIBECODOOR_MINT)],
        estimation,
        api,
      );

      expect(result.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
      // A human-readable amount, not raw lamports -- and sized from the mint, so above what a
      // classic token account would have cost.
      const fees = (result.errors.gasPrice as Error & { fees?: string }).fees;
      expect(Number(fees)).toBeGreaterThan(Number(classicAtaRent) / 1e9);
    });

    it("does not pack NotEnoughGas when spendable balance comfortably covers mint-aware ATA rent + fee", async () => {
      const intent = makeTokenIntent(VIBECODOOR_MINT);
      const estimation = await estimateFees(api, intent);

      const result = await validateIntent(
        intent,
        [makeNativeBalance(1_000_000_000n), makeTokenBalance(VIBECODOOR_MINT)],
        estimation,
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
