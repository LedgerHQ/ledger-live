import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import resolver from "../../hw-getAddress";
import { KadenaSigner } from "../../signer";
import { getPath } from "../../utils";

const address = "0xc3f95102d5c8f2c83e49ce3acfb905edfb7f37de";
const publicKey = "mockedPublicKey";
const spyGetAddress = jest.fn().mockImplementation(async () =>
  Promise.resolve({
    pubkey: Buffer.from(publicKey),
    address: address.toLowerCase(),
  }),
);

const mockSignerFactory = <T>(_: string, fn: (signer: KadenaSigner) => Promise<T>): Promise<T> =>
  fn({
    getAddressAndPubKey: spyGetAddress,
    signTransferTx: jest.fn(),
    signTransferCreateTx: jest.fn(),
    signTransferCrossChainTx: jest.fn(),
  });

describe("hw-getAddress", () => {
  it("should return an encoded address and a public key when verifiy is false", async () => {
    const getAddress = resolver(mockSignerFactory);
    const verify = false;
    const path = "44'/626'/1'/0/0";
    const response = await getAddress("deviceId", {
      path,
      verify,
      currency: getCryptoCurrencyById("kadena"),
      derivationMode: "",
    });
    expect(response.address).toBe(address);
    expect(response.publicKey).toBe(Buffer.from(publicKey).toString("hex"));
    expect(spyGetAddress).toHaveBeenCalledWith(getPath(path), verify);
  });

  it("should return an encoded address and a public key when verifiy is true", async () => {
    const getAddress = resolver(mockSignerFactory);
    const verify = true;
    const path = "44'/626'/1'/0/0";
    const response = await getAddress("deviceId", {
      path,
      verify,
      currency: getCryptoCurrencyById("kadena"),
      derivationMode: "",
    });
    expect(response.address).toBe(address);
    expect(response.publicKey).toBe(Buffer.from(publicKey).toString("hex"));
    expect(spyGetAddress).toHaveBeenCalledWith(getPath(path), verify);
  });
});
