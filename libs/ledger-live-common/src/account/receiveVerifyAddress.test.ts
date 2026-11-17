import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { AddressSchema, DerivationPathSchema } from "@domain/entity-account-descriptor";
import { genAccount } from "../mock/account";
import { registerAllCoins } from "../coin-modules/load-all-coins";
import { toReceiveVerifyAddressOptions } from "./receiveVerifyAddress";

registerAllCoins();

const ethereum = genAccount("ethereum", { currency: getCryptoCurrencyById("ethereum") });
const address = AddressSchema.parse("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
const path = DerivationPathSchema.parse("m/44h/60h/0h/0/0");
const shown = { type: "address", path, address } as const;

describe("toReceiveVerifyAddressOptions", () => {
  it("asks the device to show the address at the verification path", async () => {
    await expect(toReceiveVerifyAddressOptions(ethereum, shown)).resolves.toEqual({
      currency: expect.objectContaining({ id: "ethereum" }),
      derivationMode: ethereum.derivationMode,
      path: "44'/60'/0'/0/0",
      verify: true,
    });
  });

  it("asks a Bitcoin Cash device for its cashaddr address, as the receive bridge does", async () => {
    const bch = genAccount("bch", { currency: getCryptoCurrencyById("bitcoin_cash") });
    await expect(
      toReceiveVerifyAddressOptions(bch, {
        type: "address",
        path: DerivationPathSchema.parse("m/44h/145h/0h/0/0"),
        address: AddressSchema.parse("qp3wjpa3"),
      }),
    ).resolves.toMatchObject({ currency: { id: "bitcoin_cash" }, forceFormat: "cashaddr" });
  });

  it("asks nothing for the shielded address, which getAddress does not derive", async () => {
    await expect(
      toReceiveVerifyAddressOptions(ethereum, { ...shown, type: "shieldedAddress" }),
    ).resolves.toBeUndefined();
  });

  it("asks nothing for an address the device is given", async () => {
    await expect(
      toReceiveVerifyAddressOptions(ethereum, { ...shown, type: "addressConfirmation" }),
    ).resolves.toBeUndefined();
  });

  it("asks nothing for a key", async () => {
    await expect(
      toReceiveVerifyAddressOptions(ethereum, { type: "publicKey", path, publicKey: "302a" }),
    ).resolves.toBeUndefined();
  });
});
