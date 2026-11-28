import BigNumber from "bignumber.js";
import { DecimalSchema, WithdrawPayloadSchema } from "./schemas";
import { mayanWithdrawPayload, nearWithdrawPayload } from "./__fixtures__/responses";

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

  // /submit needs the payload back unmodified, so fields we don't read (e.g. `@type`) must stay.
  it("keeps the whole NEAR payload untouched", () => {
    expect(WithdrawPayloadSchema.parse(nearWithdrawPayload)).toEqual(nearWithdrawPayload);
  });

  it("keeps the whole Mayan payload untouched", () => {
    expect(WithdrawPayloadSchema.parse(mayanWithdrawPayload)).toEqual(mayanWithdrawPayload);
  });

  it("rejects a payload without a swap id", () => {
    const { swapId: _swapId, ...withoutSwapId } = mayanWithdrawPayload;

    expect(WithdrawPayloadSchema.safeParse(withoutSwapId).success).toBe(false);
  });

  it("rejects a payload carrying no typed data", () => {
    expect(WithdrawPayloadSchema.safeParse({ swapId: "swap-1" }).success).toBe(false);
  });
});
