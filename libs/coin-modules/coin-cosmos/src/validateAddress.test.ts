import * as bech32 from "bech32";
import cryptoFactory from "./chain/chain";
import cosmosBase from "./chain/cosmosBase";
import { validateAddress } from "./validateAddress";

jest.mock("bech32");
jest.mock("./chain/chain");

describe("validateAddress", () => {
  const mockedDecode = jest.mocked(bech32.decode);
  const mockedCryptoFactory = jest.mocked(cryptoFactory);

  beforeEach(() => {
    mockedDecode.mockClear();
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
    "should decode address, check prefix from currency config and return expected value (%s)",
    async (expectedValue: boolean) => {
      const address = "cosmos: some random address";
      const parameters = {
        currencyId: "cosmos id",
      };

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      mockedCryptoFactory.mockReturnValueOnce({
        prefix: expectedValue ? "cosmos" : "other",
      } as unknown as cosmosBase);

      const result = await validateAddress(address, parameters);

      expect(result).toEqual(expectedValue);

      expect(mockedDecode).toHaveBeenCalledTimes(1);
      expect(mockedDecode).toHaveBeenCalledWith(address);

      expect(mockedCryptoFactory).toHaveBeenCalledTimes(1);
      expect(mockedCryptoFactory).toHaveBeenCalledWith(parameters.currencyId);
    },
  );

  it("should return false when decode and prefix check fail", async () => {
    mockedDecode.mockImplementationOnce(_address => {
      throw new Error("Mocked Error from unit tests");
    });

    const address = "cosmos: some random address";
    const parameters = {
      currencyId: "cosmos id",
    };

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    mockedCryptoFactory.mockReturnValueOnce({
      prefix: "juno:",
    } as unknown as cosmosBase);

    const result = await validateAddress(address, parameters);

    expect(result).toEqual(false);

    expect(mockedDecode).toHaveBeenCalledTimes(1);
    expect(mockedDecode).toHaveBeenCalledWith(address);

    expect(mockedCryptoFactory).toHaveBeenCalledTimes(1);
    expect(mockedCryptoFactory).toHaveBeenCalledWith(parameters.currencyId);
  });
});
