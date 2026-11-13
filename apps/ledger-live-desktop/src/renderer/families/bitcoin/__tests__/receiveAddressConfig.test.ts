import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import type { AccountReceive } from "@domain/entity-account-receive";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import { receiveAddressConfig } from "../receiveAddressConfig";

const TRANSPARENT_ADDRESS = "t1Rv4exT7bqhZqi2j7xz8bUHDMxwosrjADU";
const SHIELDED_ADDRESS = "u1shieldedaddress";

const zcashInput = ({ shielded, receive }: { shielded: boolean; receive?: AccountReceive }) =>
  mockReceiveFamilyConfigInput({
    descriptor: mockUtxoAccountDescriptor({ network: "zcash", path: "m/44h/133h/0h" }),
    asset: { id: "zcash" },
    featureFlags: { zcashShielded: { enabled: shielded } },
    receive,
  });

const transparentReceive = mockAccountReceive({
  address: TRANSPARENT_ADDRESS,
  verification: undefined,
});
const shieldedReceive = mockAccountReceive({
  address: TRANSPARENT_ADDRESS,
  verification: undefined,
  shielded: { address: SHIELDED_ADDRESS },
});

describe("bitcoin receiveAddressConfig", () => {
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

  it("should show the private address notice when Zcash shielded is on and the receive data has no shielded address", () => {
    const input = zcashInput({ shielded: true, receive: transparentReceive });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo", "zcashPrivateNotEnabled"] });
  });

  it("should not show the private address notice when the receive data has a shielded address", () => {
    const input = zcashInput({ shielded: true, receive: shieldedReceive });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo"] });
  });

  it("should not show the private address notice before the receive data is read", () => {
    expect(receiveAddressConfig(zcashInput({ shielded: true }))).toEqual({ notices: ["utxo"] });
  });

  it("should not show the private address notice when Zcash shielded is off", () => {
    const input = zcashInput({ shielded: false, receive: transparentReceive });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo"] });
  });
});
