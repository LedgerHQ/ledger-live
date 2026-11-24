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

describe("zcash receiveAddressConfig", () => {
  it("should always show the utxo notice", () => {
    expect(receiveAddressConfig(zcashInput({ shielded: false }))).toEqual({ notices: ["utxo"] });
  });

  it("should never show the taproot or Dash staking notices", () => {
    const { notices } = receiveAddressConfig(zcashInput({ shielded: true }));

    expect(notices).not.toContain("taproot");
    expect(notices).not.toContain("dashStaking");
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
