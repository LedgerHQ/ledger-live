import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import { receiveAddressConfig } from "../receiveAddressConfig";

describe("cardano receiveAddressConfig", () => {
  it("should show the utxo notice", () => {
    expect(receiveAddressConfig(mockReceiveFamilyConfigInput())).toEqual({ notices: ["utxo"] });
  });
});
