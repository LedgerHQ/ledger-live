import BigNumber from "bignumber.js";
import { BalanceAssetIdSchema } from "@domain/entity-account-balance";
import { NotServedByAccountDataError } from "./routeHandlers";
import { toSendRequest } from "./toSendRequest";

const ethereum = BalanceAssetIdSchema.parse("ethereum");
const recipient = "0x0000000000000000000000000000000000000002";

describe("toSendRequest", () => {
  it("reads a plain transfer", () => {
    expect(
      toSendRequest(ethereum, { family: "ethereum", amount: new BigNumber(1000), recipient }),
    ).toEqual({ assetId: "ethereum", recipient, amount: "1000" });
  });

  it("carries a memo, whatever key the network names it with", () => {
    const xrp = BalanceAssetIdSchema.parse("ripple");
    expect(
      toSendRequest(xrp, { family: "ripple", amount: new BigNumber(1), recipient: "r1", tag: 42 }),
    ).toEqual(expect.objectContaining({ memo: "42" }));
  });

  it("hands a contract call back to the legacy handler", () => {
    expect(() =>
      toSendRequest(ethereum, {
        family: "ethereum",
        amount: new BigNumber(0),
        recipient,
        data: Buffer.from("a9059cbb", "hex"),
      }),
    ).toThrow(NotServedByAccountDataError);
  });

  it("ignores fields left undefined", () => {
    expect(
      toSendRequest(ethereum, {
        family: "ethereum",
        amount: new BigNumber(1),
        recipient,
        data: undefined,
      }),
    ).toEqual({ assetId: "ethereum", recipient, amount: "1" });
  });
});
