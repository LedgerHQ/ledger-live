import BigNumber from "bignumber.js";
import {
  WithdrawCurrenciesSchema,
  WithdrawPayloadSchema,
  WithdrawQuoteSchema,
  WithdrawStatusSchema,
  getWithdrawTypedData,
} from "./schemas";
import {
  currenciesResponse,
  finishedStatusResponse,
  mayanPayloadResponse,
  nearPayloadResponse,
  quoteResponse,
  statusResponse,
} from "./__fixtures__/responses";

describe("withdraw schemas", () => {
  it("parses the supported currencies", () => {
    expect(WithdrawCurrenciesSchema.parse(currenciesResponse).currencies).toHaveLength(3);
  });

  it("parses a quote and reads its decimal string amounts as BigNumber", () => {
    const quote = WithdrawQuoteSchema.parse(quoteResponse);

    expect(quote.amountTo).toEqual(new BigNumber("0.3"));
    expect(quote.payoutNetworkFees).toEqual(new BigNumber("0.0004"));
    expect(quote.expiry).toBe(quoteResponse.expiry);
  });

  it.each([
    ["a JSON number, already rounded by JavaScript", 0.1 + 0.2],
    ["a hex string", "0x10"],
    ["Infinity", "Infinity"],
    ["an empty string", ""],
  ])("rejects an amount sent as %s", (_, amountTo) => {
    expect(WithdrawQuoteSchema.safeParse({ ...quoteResponse, amountTo }).success).toBe(false);
  });

  it("rejects a quote without amountTo", () => {
    const { amountTo: _, ...withoutAmount } = quoteResponse;
    expect(WithdrawQuoteSchema.safeParse(withoutAmount).success).toBe(false);
  });

  it("reads the typed data at the root for a Mayan payload", () => {
    const payload = WithdrawPayloadSchema.parse(mayanPayloadResponse);
    expect(getWithdrawTypedData(payload)).toEqual(mayanPayloadResponse.typedData);
  });

  it("reads the nested typed data for a NEAR payload", () => {
    const payload = WithdrawPayloadSchema.parse(nearPayloadResponse);
    expect(getWithdrawTypedData(payload)).toEqual(nearPayloadResponse.hyperCoreAction.typedData);
  });

  it("keeps every field of a NEAR hyperCoreAction so it can be resubmitted unmodified", () => {
    const payload = WithdrawPayloadSchema.parse(nearPayloadResponse);
    expect(payload).toEqual(nearPayloadResponse);
  });

  it("keeps unknown fields inside EIP-712 type entries", () => {
    const withExtra = {
      ...mayanPayloadResponse,
      typedData: {
        ...mayanPayloadResponse.typedData,
        types: { Withdraw: [{ name: "amount", type: "string", extra: "keep-me" }] },
      },
    };

    expect(WithdrawPayloadSchema.parse(withExtra)).toEqual(withExtra);
  });

  it("signs the HyperCore action when a payload carries both shapes", () => {
    const rootTypedData = { ...mayanPayloadResponse.typedData, primaryType: "Root" };
    const payload = WithdrawPayloadSchema.parse({
      ...nearPayloadResponse,
      typedData: rootTypedData,
    });

    expect(getWithdrawTypedData(payload)).toEqual(nearPayloadResponse.hyperCoreAction.typedData);
  });

  it("rejects a payload carrying no typed data", () => {
    expect(WithdrawPayloadSchema.safeParse({ swapId: "swap-1" }).success).toBe(false);
  });

  it.each(["READY", "PENDING", "UNKNOWN", "FINISHED", "REFUNDED", "EXPIRED"])(
    "accepts the %s status",
    status => {
      expect(WithdrawStatusSchema.parse({ ...statusResponse, status }).status).toBe(status);
    },
  );

  it("rejects a status outside the documented list", () => {
    expect(WithdrawStatusSchema.safeParse({ ...statusResponse, status: "DONE" }).success).toBe(
      false,
    );
  });

  it("parses the explorer transaction ids of a finished withdrawal", () => {
    const status = WithdrawStatusSchema.parse(finishedStatusResponse);
    expect(status.payinTransactionId).toBe("0xpayin");
    expect(status.payoutTransactionId).toBe("0xpayout");
  });
});
