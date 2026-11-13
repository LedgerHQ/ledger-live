import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import type { BitcoinAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { receiveAddressConfig } from "../receiveAddressConfig";

const zcashAccount = (privateInfo?: object) => ({ privateInfo }) as unknown as BitcoinAccount;

const zcashInput = ({ shielded, privateInfo }: { shielded: boolean; privateInfo?: object }) =>
  mockReceiveFamilyConfigInput<BitcoinAccount>({
    descriptor: mockUtxoAccountDescriptor({ network: "zcash", path: "m/44h/133h/0h" }),
    asset: { id: "zcash" },
    featureFlags: { zcashShielded: { enabled: shielded } },
    legacyAccount: zcashAccount(privateInfo),
  });

describe("bitcoin receiveAddressConfig", () => {
  it("should show the utxo notice on a native segwit account", () => {
    expect(receiveAddressConfig(mockReceiveFamilyConfigInput<BitcoinAccount>())).toEqual({
      notices: ["utxo"],
    });
  });

  it("should show the taproot notice on a taproot account", () => {
    const input = mockReceiveFamilyConfigInput<BitcoinAccount>({
      descriptor: mockUtxoAccountDescriptor({ path: "m/86h/0h/0h" }),
    });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo", "taproot"] });
  });

  it("should show the staking notice on a Dash account", () => {
    const input = mockReceiveFamilyConfigInput<BitcoinAccount>({
      descriptor: mockUtxoAccountDescriptor({ network: "dash", path: "m/44h/5h/0h" }),
      asset: { id: "dash" },
    });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo", "dashStaking"] });
  });

  it("should show the private address notice when Zcash shielded is on and the account has no shielded address", () => {
    const input = zcashInput({ shielded: true, privateInfo: { ufvk: "uview1test" } });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo", "zcashPrivateNotEnabled"] });
  });

  it("should not show the private address notice when the Zcash account has a shielded address", () => {
    const input = zcashInput({ shielded: true, privateInfo: { shieldedAddress: "u1abc" } });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo"] });
  });

  it("should not show the private address notice when Zcash shielded is off", () => {
    expect(receiveAddressConfig(zcashInput({ shielded: false }))).toEqual({ notices: ["utxo"] });
  });
});
