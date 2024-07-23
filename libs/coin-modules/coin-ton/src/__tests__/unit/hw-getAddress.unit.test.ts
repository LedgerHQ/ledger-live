import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import resolver from "../../hw-getAddress";
import { TonSigner } from "../../signer";
import { getLedgerTonPath } from "../../utils";

const address = "0xc3f95102d5c8f2c83e49ce3acfb905edfb7f37de";
const publicKey = "mockedPublicKey";
const spyGetAddress = jest.fn().mockImplementation(async () =>
  Promise.resolve({
    publicKey,
    address: address.toLowerCase(),
  }),
);
const spyValidateAddress = jest.fn().mockImplementation(async () =>
  Promise.resolve({
    publicKey,
    address: address.toLowerCase(),
  }),
);

const mockSignerFactory = <T>(_: string, fn: (signer: TonSigner) => Promise<T>): Promise<T> =>
  fn({
    getAddress: spyGetAddress,
    validateAddress: spyValidateAddress,
    signTransaction: jest.fn(),
  });

describe("hw-getAddress", () => {
  it("should return an encoded address and a public key when verifiy is false", async () => {
    const getAddress = resolver(mockSignerFactory);
    const response = await getAddress("deviceId", {
      path: "44'/607'/0'/0'/0'/0'",
      verify: false,
      currency: getCryptoCurrencyById("ton"),
      derivationMode: "ton",
    });
    expect(response.address).toBe(address);
    expect(response.publicKey).toBe(publicKey);
    expect(spyGetAddress).toHaveBeenCalledWith(getLedgerTonPath("44'/607'/0'/0'/0'/0'"), {
      bounceable: false,
    });
  });

  it("should return an encoded address and a public key when verifiy is true", async () => {
    const getAddress = resolver(mockSignerFactory);
    const response = await getAddress("deviceId", {
      path: "44'/607'/0'/0'/0'/0'",
      verify: true,
      currency: getCryptoCurrencyById("ton"),
      derivationMode: "ton",
    });
    expect(response.address).toBe(address);
    expect(response.publicKey).toBe(publicKey);
    expect(spyValidateAddress).toHaveBeenCalledWith(getLedgerTonPath("44'/607'/0'/0'/0'/0'"), {
      bounceable: false,
    });
  });
});
