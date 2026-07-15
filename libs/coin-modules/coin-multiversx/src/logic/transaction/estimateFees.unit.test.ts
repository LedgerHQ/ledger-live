import { estimateFees } from "./estimateFees";
import type {
  TransactionIntent,
  StakingTransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { GAS, GAS_PRICE, MIN_GAS_LIMIT } from "../../constants";

const SENDER = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

function makeNativeIntent(): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: SENDER,
    amount: 1000n,
    asset: { type: "native" },
  };
}

describe("estimateFees", () => {
  it("returns MIN_GAS_LIMIT fees for native transfer", async () => {
    const fee = await estimateFees(makeNativeIntent());
    expect(fee.value).toBe(BigInt(MIN_GAS_LIMIT) * BigInt(GAS_PRICE));
  });

  it("returns ESDT_TRANSFER gas for ESDT intent", async () => {
    const intent: TransactionIntent = {
      ...makeNativeIntent(),
      asset: { type: "esdt", assetReference: "USDC-c76f1f" },
    };
    const fee = await estimateFees(intent);
    expect(fee.value).toBe(BigInt(GAS.ESDT_TRANSFER) * BigInt(GAS_PRICE));
  });

  it("returns DELEGATE gas for delegate intent", async () => {
    const intent = {
      ...makeNativeIntent(),
      type: "delegate",
    } as unknown as StakingTransactionIntent;
    const fee = await estimateFees(intent);
    expect(fee.value).toBe(BigInt(GAS.DELEGATE) * BigInt(GAS_PRICE));
  });

  it("returns CLAIM gas for claimRewards intent", async () => {
    const intent = {
      ...makeNativeIntent(),
      type: "claimRewards",
    } as unknown as StakingTransactionIntent;
    const fee = await estimateFees(intent);
    expect(fee.value).toBe(BigInt(GAS.CLAIM) * BigInt(GAS_PRICE));
  });

  it("uses customFeesParameters.gasLimit when provided (number)", async () => {
    const fee = await estimateFees(makeNativeIntent(), { gasLimit: 99999 });
    expect(fee.value).toBe(BigInt(99999) * BigInt(GAS_PRICE));
  });

  it("accepts a bigint gasLimit without a type assertion", async () => {
    const fee = await estimateFees(makeNativeIntent(), { gasLimit: 99999n });
    expect(fee.value).toBe(BigInt(99999) * BigInt(GAS_PRICE));
  });
});
