import { getAddress } from "ethers";
import { validateAddress } from "./validateAddress";

jest.mock("ethers");

describe("validateAddress", () => {
  const mockedGetAddress = jest.mocked(getAddress);

  beforeEach(() => {
    mockedGetAddress.mockClear();
  });

  it.each([
    "",
    "some random address",
    "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7", // bitcoin
    "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp", // Solana
    "addr1q9dkdemkwprf8qscpjpecpvqfw2aemempn0gzplr4rh2s2fwlqyt4mswmh4hl0nnq53r4rp798vj4c7p7f2wdgqnc8uqvvxkmk", // Cardano
    "random-domain.sol",
    "random domain on.sui",
    "near domain",
    "algo_domain",
  ])(
    "should return false when address does match ethereum address or domain regex",
    async (address: string) => {
      const result = await validateAddress(address, {});
      expect(result).toEqual(false);
    },
  );

  it("should return true when address does match regex and checksum is verified", async () => {
    const address = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    mockedGetAddress.mockImplementationOnce(addressParam => {
      if (address === addressParam) {
        return address;
      }

      return "";
    });

    const result = await validateAddress(address, {});
    expect(result).toEqual(true);

    expect(mockedGetAddress).toHaveBeenCalledTimes(1);
    expect(mockedGetAddress).toHaveBeenCalledWith(address);
  });

  it("should return true when address match domain regex and not address", async () => {
    const address = "zombqa-test.eth";
    const result = await validateAddress(address, {});
    expect(result).toEqual(true);

    expect(mockedGetAddress).toHaveBeenCalledTimes(0);
  });

  it("should return false when address does match regex and checksum is not verified", async () => {
    mockedGetAddress.mockReturnValueOnce("");

    const address = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    const result = await validateAddress(address, {});
    expect(result).toEqual(false);

    expect(mockedGetAddress).toHaveBeenCalledTimes(1);
    expect(mockedGetAddress).toHaveBeenCalledWith(address);
  });
});
