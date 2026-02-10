import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import * as sidecar from "./sidecar";
import network from ".";

jest.mock("./sidecar");
const mockedSidecar = jest.mocked(sidecar);

const currency: CryptoCurrency = getCryptoCurrencyById("polkadot");

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
