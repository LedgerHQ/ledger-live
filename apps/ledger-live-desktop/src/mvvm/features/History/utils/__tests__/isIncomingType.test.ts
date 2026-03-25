import type { OperationType } from "@ledgerhq/types-live";
import { isIncomingType } from "../isIncomingType";

describe("isIncomingType", () => {
  it.each<[OperationType, boolean]>([
    ["IN", true],
    ["REVEAL", true],
    ["REWARD_PAYOUT", true],
    ["OUT", false],
  ])("isIncomingType(%s) => %s", (type, expected) => {
    expect(isIncomingType(type)).toBe(expected);
  });
});
