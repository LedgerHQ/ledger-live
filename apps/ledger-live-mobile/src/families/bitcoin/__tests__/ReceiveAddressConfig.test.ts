import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import receiveAddressConfig from "../ReceiveAddressConfig";

describe("bitcoin ReceiveAddressConfig", () => {
  it("should show the utxo notice on a native segwit account", () => {
    expect(receiveAddressConfig(mockReceiveFamilyConfigInput())).toEqual({ notices: ["utxo"] });
  });

  it("should show the taproot notice on a taproot account", () => {
    const input = mockReceiveFamilyConfigInput({
      descriptor: mockUtxoAccountDescriptor({ path: "m/86h/0h/0h" }),
    });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo", "taproot"] });
  });

  it("should show the staking notice on a Dash account", () => {
    const input = mockReceiveFamilyConfigInput({
      descriptor: mockUtxoAccountDescriptor({ network: "dash", path: "m/44h/5h/0h" }),
      asset: { id: "dash" },
    });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo", "dashStaking"] });
  });
});
