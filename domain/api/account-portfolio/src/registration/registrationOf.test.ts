import { registrationOf } from "./registrationOf";
import { mockAddressDescriptor, mockUtxoDescriptor, MOCK_XPUB } from "../portfolioApi.mock";

describe("registrationOf", () => {
  it("registers Bitcoin and skips a chain with no strategy", () => {
    expect(registrationOf(mockUtxoDescriptor(MOCK_XPUB))).toMatchObject({ type: "auto_derive" });
    expect(
      registrationOf(mockAddressDescriptor("solana", "9xyz", "m/44h/501h/0h/0h")),
    ).toBeUndefined();
  });
});
