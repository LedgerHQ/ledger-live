import { AddressSchema } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import { registerAllCoins } from "../coin-modules/load-all-coins";
import { toReceiveVerifyAddressOptions } from "./receiveVerifyAddress";

registerAllCoins();

const descriptor = mockAddressAccountDescriptor();
const address = AddressSchema.parse("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
const shown = { type: "address", path: "m/44h/60h/0h/0/0", address } as const;

describe("toReceiveVerifyAddressOptions", () => {
  it("asks the device to show the address at the verification path", async () => {
    await expect(toReceiveVerifyAddressOptions(descriptor, shown, "receive")).resolves.toEqual({
      currency: expect.objectContaining({ id: "ethereum" }),
      derivationMode: "",
      path: "44'/60'/0'/0/0",
      verify: true,
    });
  });

  it("asks a Bitcoin Cash device for its cashaddr address, as the receive bridge does", async () => {
    const bch = mockUtxoAccountDescriptor({ network: "bitcoin_cash", path: "m/44h/145h/0h" });
    await expect(
      toReceiveVerifyAddressOptions(
        bch,
        { type: "address", path: "m/44h/145h/0h/0/0", address: AddressSchema.parse("qp3wjpa3") },
        "receive",
      ),
    ).resolves.toMatchObject({ currency: { id: "bitcoin_cash" }, forceFormat: "cashaddr" });
  });

  it("asks nothing for the shielded address, which getAddress does not derive", async () => {
    await expect(
      toReceiveVerifyAddressOptions(descriptor, shown, "shielded"),
    ).resolves.toBeUndefined();
  });

  it("asks nothing for an address the device is given", async () => {
    await expect(
      toReceiveVerifyAddressOptions(
        descriptor,
        { ...shown, type: "addressConfirmation" },
        "receive",
      ),
    ).resolves.toBeUndefined();
  });

  it("asks nothing for a key", async () => {
    await expect(
      toReceiveVerifyAddressOptions(
        descriptor,
        { type: "publicKey", path: "m/44h/60h/0h/0/0", publicKey: "302a" },
        "receive",
      ),
    ).resolves.toBeUndefined();
  });
});
