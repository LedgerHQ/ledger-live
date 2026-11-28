import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import receiveAddressConfig from "../ReceiveAddressConfig";

describe("cardano ReceiveAddressConfig", () => {
  it("should show the utxo notice when receiving ADA", () => {
    const input = mockReceiveFamilyConfigInput({ asset: { id: "cardano" } });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo"] });
  });

  it("should not show a notice when receiving a token", () => {
    const input = mockReceiveFamilyConfigInput({
      asset: { id: "cardano/native/token", type: "TokenCurrency" },
    });

    expect(receiveAddressConfig(input)).toEqual({});
  });
});
