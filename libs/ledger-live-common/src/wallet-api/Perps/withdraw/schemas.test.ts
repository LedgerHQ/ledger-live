import BigNumber from "bignumber.js";
import { DecimalSchema, WithdrawPayloadSchema, getWithdrawTypedData } from "./schemas";
import { mayanPayloadResponse, nearPayloadResponse } from "./__fixtures__/responses";

describe("withdraw schemas", () => {
  it("reads decimal string amounts as BigNumber", () => {
    expect(DecimalSchema.parse("0.3")).toEqual(new BigNumber("0.3"));
  });

  it.each([
    ["a JSON number, already rounded by JavaScript", 0.1 + 0.2],
    ["a hex string", "0x10"],
    ["Infinity", "Infinity"],
    ["an empty string", ""],
  ])("rejects an amount sent as %s", (_, value) => {
    expect(DecimalSchema.safeParse(value).success).toBe(false);
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
});
