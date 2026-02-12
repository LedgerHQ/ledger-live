import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as bech32 from "bech32";
import cryptoFactory from "./chain/chain";
import cosmosBase from "./chain/cosmosBase";
import { validateAddress } from "./validateAddress";

jest.mock("bech32");
jest.mock("@ledgerhq/cryptoassets");
jest.mock("./chain/chain");

describe("validateAddress", () => {
  const mockedDecode = jest.mocked(bech32.decode);
  const mockedFindCryptoCurrencyById = jest.mocked(findCryptoCurrencyById);
  const mockedCryptoFactory = jest.mocked(cryptoFactory);

  beforeEach(() => {
    mockedDecode.mockClear();
    mockedFindCryptoCurrencyById.mockClear();
    mockedCryptoFactory.mockClear();
  });

  it("should throw an error when currency parameters is not provided", async () => {
    try {
      await validateAddress("some random address", {});
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual(
        "Missing currency parameter on address validation for Cosmos",
      );
    }
  });

  it.each([true, false])(
    "should only decode address when currency config not found and return expected value (%s)",
    async (expectedValue: boolean) => {
      if (!expectedValue) {
        mockedDecode.mockImplementationOnce(_address => {
          throw new Error("Mocked Error from unit test");
        });
      }

      mockedFindCryptoCurrencyById.mockReturnValueOnce(undefined);
      const address = "some random address";
      const parameters = {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        currency: {
          name: "cosmos",
        } as CryptoCurrency,
      };

      const result = await validateAddress(address, parameters);

      expect(result).toEqual(expectedValue);

      expect(mockedDecode).toHaveBeenCalledTimes(1);
      expect(mockedDecode).toHaveBeenCalledWith(address);

      expect(mockedFindCryptoCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockedFindCryptoCurrencyById).toHaveBeenCalledWith(parameters.currency.name);
    },
  );

  it.each([true, false])(
    "should decode address, check prefix from currency config and return expected value (%s)",
    async (expectedValue: boolean) => {
      const address = "cosmos: some random address";
      const parameters = {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        currency: {
          id: "cosmos id",
          name: "cosmos name",
        } as CryptoCurrency,
      };

      mockedFindCryptoCurrencyById.mockReturnValueOnce(parameters.currency);

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      mockedCryptoFactory.mockReturnValueOnce({
        prefix: expectedValue ? "cosmos" : "other",
      } as unknown as cosmosBase);

      const result = await validateAddress(address, parameters);

      expect(result).toEqual(expectedValue);

      expect(mockedDecode).toHaveBeenCalledTimes(1);
      expect(mockedDecode).toHaveBeenCalledWith(address);

      expect(mockedFindCryptoCurrencyById).toHaveBeenCalledTimes(1);
      expect(mockedFindCryptoCurrencyById).toHaveBeenCalledWith(parameters.currency.name);

      expect(mockedCryptoFactory).toHaveBeenCalledTimes(1);
      expect(mockedCryptoFactory).toHaveBeenCalledWith(parameters.currency.id);
    },
  );

  it("should return false when decode and prefix check fail", async () => {
    mockedDecode.mockImplementationOnce(_address => {
      throw new Error("Mocked Error from unit tests");
    });

    const address = "cosmos: some random address";
    const parameters = {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      currency: {
        id: "cosmos id",
        name: "cosmos name",
      } as CryptoCurrency,
    };

    mockedFindCryptoCurrencyById.mockReturnValueOnce(parameters.currency);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    mockedCryptoFactory.mockReturnValueOnce({
      prefix: "juno:",
    } as unknown as cosmosBase);

    const result = await validateAddress(address, parameters);

    expect(result).toEqual(false);

    expect(mockedDecode).toHaveBeenCalledTimes(1);
    expect(mockedDecode).toHaveBeenCalledWith(address);

    expect(mockedFindCryptoCurrencyById).toHaveBeenCalledTimes(1);
    expect(mockedFindCryptoCurrencyById).toHaveBeenCalledWith(parameters.currency.name);

    expect(mockedCryptoFactory).toHaveBeenCalledTimes(1);
    expect(mockedCryptoFactory).toHaveBeenCalledWith(parameters.currency.id);
  });
});
