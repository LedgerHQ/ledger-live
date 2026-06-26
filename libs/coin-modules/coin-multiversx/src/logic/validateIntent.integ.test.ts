import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import {
  MultiversXTokenIdentifierRequired,
  MultiversXUnsupportedAssetType,
  NotEnoughEGLDForFees,
} from "../errors";
import { estimateFees } from "./estimateFees";
import { validateIntent } from "./validateIntent";

const SENDER = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
const RECIPIENT = "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2";
const TOKEN = "USDC-c76f1f";

const ONE_EGLD = 1_000_000_000_000_000_000n;

function nativeBalance(value: bigint): Balance {
  return { value, asset: { type: "native" } };
}

function tokenBalance(value: bigint, assetReference = TOKEN): Balance {
  return { value, asset: { type: "esdt", assetReference, name: "USDC" } } as Balance;
}

function nativeSend(overrides: Partial<TransactionIntent> = {}): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: ONE_EGLD,
    asset: { type: "native" },
    ...overrides,
  };
}

describe("validateIntent (integration)", () => {
  it("accepts a native transfer that fits within the balance", async () => {
    const fees = estimateFees(nativeSend());
    const result = await validateIntent(nativeSend(), [nativeBalance(10n * ONE_EGLD)], fees);

    expect(result.errors).toEqual({});
    expect(result.estimatedFees).toBe(fees.value);
    expect(result.amount).toBe(ONE_EGLD);
    expect(result.totalSpent).toBe(ONE_EGLD + fees.value);
  });

  it("flags NotEnoughBalance when amount plus fees exceeds the native balance", async () => {
    const fees = estimateFees(nativeSend());
    const result = await validateIntent(
      nativeSend({ amount: ONE_EGLD }),
      [nativeBalance(ONE_EGLD)],
      fees,
    );

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("flags AmountRequired for a zero amount", async () => {
    const result = await validateIntent(nativeSend({ amount: 0n }), [
      nativeBalance(10n * ONE_EGLD),
    ]);

    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("flags InvalidAddress for a malformed recipient", async () => {
    const result = await validateIntent(nativeSend({ recipient: "not-a-valid-address" }), [
      nativeBalance(10n * ONE_EGLD),
    ]);

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("flags RecipientRequired when the recipient is missing", async () => {
    const result = await validateIntent(nativeSend({ recipient: "" }), [
      nativeBalance(10n * ONE_EGLD),
    ]);

    expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("flags an unsupported asset type", async () => {
    const result = await validateIntent(
      nativeSend({ asset: { type: "erc20" } as unknown as TransactionIntent["asset"] }),
      [nativeBalance(10n * ONE_EGLD)],
    );

    expect(result.errors.asset).toBeInstanceOf(MultiversXUnsupportedAssetType);
  });

  it("requires a token identifier for ESDT transfers", async () => {
    const result = await validateIntent(
      nativeSend({
        asset: { type: "esdt", assetReference: "" } as unknown as TransactionIntent["asset"],
      }),
      [nativeBalance(10n * ONE_EGLD)],
    );

    expect(result.errors.asset).toBeInstanceOf(MultiversXTokenIdentifierRequired);
  });

  it("flags NotEnoughEGLDForFees for an ESDT transfer with no native balance", async () => {
    const intent = nativeSend({
      amount: 1_000_000n,
      asset: { type: "esdt", assetReference: TOKEN, name: "USDC" } as TransactionIntent["asset"],
    });
    const fees = estimateFees(intent);
    const result = await validateIntent(
      intent,
      [nativeBalance(0n), tokenBalance(10_000_000n)],
      fees,
    );

    expect(result.errors.fees).toBeInstanceOf(NotEnoughEGLDForFees);
  });
});
