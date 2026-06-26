import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { GAS, GAS_PRICE, MIN_GAS_LIMIT } from "../constants";
import { estimateFees } from "./estimateFees";

const SENDER = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
const RECIPIENT = "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2";
const DELEGATION_CONTRACT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy";

const nativeSend: TransactionIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: 1_000_000_000_000_000_000n,
  asset: { type: "native" },
};

// Fees on MultiversX are deterministic: fee = gasLimit * gasPrice.
describe("estimateFees (integration)", () => {
  it("estimates a native transfer at the minimum gas limit", () => {
    const result = estimateFees(nativeSend);

    expect(result.parameters?.gasLimit).toBe(BigInt(MIN_GAS_LIMIT));
    expect(result.parameters?.gasPrice).toBe(BigInt(GAS_PRICE));
    expect(result.value).toBe(BigInt(MIN_GAS_LIMIT) * BigInt(GAS_PRICE));
  });

  it("uses the ESDT gas limit for token transfers", () => {
    const result = estimateFees({
      ...nativeSend,
      asset: { type: "esdt", assetReference: "USDC-c76f1f", name: "USDC" },
    } as TransactionIntent);

    expect(result.parameters?.gasLimit).toBe(BigInt(GAS.ESDT_TRANSFER));
    expect(result.value).toBe(BigInt(GAS.ESDT_TRANSFER) * BigInt(GAS_PRICE));
  });

  it("uses the delegation gas limit for a staking intent", () => {
    const result = estimateFees({
      intentType: "staking",
      type: "delegate",
      sender: SENDER,
      recipient: DELEGATION_CONTRACT,
      amount: 1_000_000_000_000_000_000n,
      asset: { type: "native" },
    } as unknown as TransactionIntent);

    expect(result.parameters?.gasLimit).toBe(BigInt(GAS.DELEGATE));
    expect(result.value).toBe(BigInt(GAS.DELEGATE) * BigInt(GAS_PRICE));
  });

  it("honours a custom gas price and limit override", () => {
    const result = estimateFees(nativeSend, { gasLimit: 60_000n, gasPrice: 2_000_000_000n });

    expect(result.parameters?.gasLimit).toBe(60_000n);
    expect(result.parameters?.gasPrice).toBe(2_000_000_000n);
    expect(result.value).toBe(60_000n * 2_000_000_000n);
  });

  it("falls back to the network gas price when provided and no override is set", () => {
    const networkGasPrice = 1_500_000_000n;
    const result = estimateFees(nativeSend, undefined, networkGasPrice);

    expect(result.parameters?.gasPrice).toBe(networkGasPrice);
    expect(result.value).toBe(BigInt(MIN_GAS_LIMIT) * networkGasPrice);
  });
});
