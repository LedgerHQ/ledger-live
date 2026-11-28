import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockReceiveFamilyConfigInput } from "@features/flow-receive/types.mock";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, DerivationMode } from "@ledgerhq/types-live";
import receiveAddressConfig from "../ReceiveAddressConfig";

const bitcoinAccount = (derivationMode: DerivationMode): Account => ({
  ...genAccount("bitcoin-receive", { currency: getCryptoCurrencyById("bitcoin") }),
  derivationMode,
});

describe("bitcoin ReceiveAddressConfig", () => {
  it("should show the utxo notice on a native segwit account", () => {
    const input = mockReceiveFamilyConfigInput({ legacyAccount: bitcoinAccount("native_segwit") });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo"] });
  });

  it("should show the taproot notice on a taproot account", () => {
    const input = mockReceiveFamilyConfigInput({ legacyAccount: bitcoinAccount("taproot") });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo", "taproot"] });
  });

  it("should show the staking notice on a Dash account", () => {
    const input = mockReceiveFamilyConfigInput<Account>({ asset: { id: "dash" } });

    expect(receiveAddressConfig(input)).toEqual({ notices: ["utxo", "dashStaking"] });
  });
});
