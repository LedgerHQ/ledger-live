import { buildVerifyAddressIntentInput } from "../buildVerifyAddressIntentInput";
import { VERIFY_ADDRESS, VERIFY_SELECTION } from "./verifySelection.fixture";

describe("buildVerifyAddressIntentInput", () => {
  it("should expect the address the receive data says the device shows", () => {
    expect(buildVerifyAddressIntentInput(VERIFY_SELECTION).expectedAddress).toBe(VERIFY_ADDRESS);
  });
});
