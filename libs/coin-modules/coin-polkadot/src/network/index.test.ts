import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import * as sidecar from "./sidecar";
import network from ".";

jest.mock("./sidecar");
const mockedSidecar = jest.mocked(sidecar);

const currency: CryptoCurrency = getCryptoCurrencyById("polkadot");

describe("shortenMetadata", () => {
  afterEach(() => {
    mockedSidecar.shortenMetadata.mockClear();
  });

  it("should pass callData, includedInExtrinsic, includedInSignedData and currency to sidecar", async () => {
    mockedSidecar.shortenMetadata.mockResolvedValueOnce("0xmetadatablob");

    const callData = "0x0a0300abcdef";
    const includedInExtrinsic = "0xf50020000001";
    const includedInSignedData = "0x" + "aa".repeat(105);

    const result = await network.shortenMetadata(
      callData,
      includedInExtrinsic,
      includedInSignedData,
      currency,
    );

    expect(result).toBe("0xmetadatablob");
    expect(mockedSidecar.shortenMetadata).toHaveBeenCalledTimes(1);
    expect(mockedSidecar.shortenMetadata).toHaveBeenCalledWith(
      callData,
      includedInExtrinsic,
      includedInSignedData,
      currency,
    );
  });
});

describe("getMinimumBondBalance", () => {
  afterEach(() => {
    mockedSidecar.getMinimumBondBalance.mockClear();
  });

  it("is called once due to cache", async () => {
    mockedSidecar.getMinimumBondBalance.mockResolvedValueOnce(new BigNumber("12"));
    let minBond = await network.getMinimumBondBalance(currency);
    expect(minBond).toEqual(new BigNumber("12"));
    expect(mockedSidecar.getMinimumBondBalance).toHaveBeenCalledTimes(1);

    // This new value should never been called as the previous one is cached
    mockedSidecar.getMinimumBondBalance.mockResolvedValueOnce(new BigNumber("13"));
    minBond = await network.getMinimumBondBalance(currency);
    expect(minBond).toEqual(new BigNumber("12"));
    expect(mockedSidecar.getMinimumBondBalance).toHaveBeenCalledTimes(1);
  });
});

describe("isNewAccount", () => {
  afterEach(() => {
    mockedSidecar.isNewAccount.mockClear();
  });

  it("is called once due to cache", async () => {
    mockedSidecar.isNewAccount.mockResolvedValueOnce(false);
    let isNewAccount = await network.isNewAccount("0xfff", currency);
    expect(isNewAccount).toEqual(false);
    expect(mockedSidecar.isNewAccount).toHaveBeenCalledTimes(1);
    expect(mockedSidecar.getMinimumBondBalance).toHaveBeenCalledTimes(0);

    // This new value should never been called as the previous one is cached
    mockedSidecar.isNewAccount.mockResolvedValueOnce(true);
    isNewAccount = await network.isNewAccount("0xfff", currency);
    expect(isNewAccount).toEqual(false);
    expect(mockedSidecar.isNewAccount).toHaveBeenCalledTimes(1);
    expect(mockedSidecar.getMinimumBondBalance).toHaveBeenCalledTimes(0);
  });
});
