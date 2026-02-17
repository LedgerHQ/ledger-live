import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { SidecarValidatorsParamAddresses, SidecarValidatorsParamStatus } from "../network/types";
import { createFixtureAccount } from "../types/bridge.fixture";
import { preload } from "./preload";

const account = createFixtureAccount();

const getRegistryMock = jest.fn();
const getMinimumBondBalanceMock = jest.fn();
const getStakingProgressMock = jest.fn();
const getValidatorsMock = jest.fn();

jest.mock("../network", () => {
  return {
    getRegistry: (currency: CryptoCurrency | undefined) => getRegistryMock(currency),
    getMinimumBondBalance: (currency: CryptoCurrency | undefined) =>
      getMinimumBondBalanceMock(currency),
    getStakingProgress: (currency: CryptoCurrency | undefined) => getStakingProgressMock(currency),
    getValidators: (
      stashes: SidecarValidatorsParamStatus | SidecarValidatorsParamAddresses = "elected",
      currency?: CryptoCurrency,
    ) => getValidatorsMock(stashes, currency),
  };
});

describe("preload", () => {
  //TODO make a more complete test
  it("should correctly preload data", async () => {
    getMinimumBondBalanceMock.mockResolvedValue(0n);

    const currency = getCryptoCurrencyById(account.currency.id);
    await preload(currency);

    expect(getRegistryMock).toHaveBeenCalledTimes(1);
    expect(getMinimumBondBalanceMock).toHaveBeenCalledTimes(1);
    expect(getStakingProgressMock).toHaveBeenCalledTimes(1);
    expect(getValidatorsMock).toHaveBeenCalledTimes(1);
  });

  it("should return fallback stakingProgress if getStakingProgress throws", async () => {
    getStakingProgressMock.mockRejectedValue(new Error("issou"));
    const currency = getCryptoCurrencyById(account.currency.id);
    const result = await preload(currency);
    expect(result.staking).toEqual({
      electionClosed: true,
      activeEra: 0,
      maxNominatorRewardedPerValidator: 128,
      bondingDuration: 28,
    });
  });
});
