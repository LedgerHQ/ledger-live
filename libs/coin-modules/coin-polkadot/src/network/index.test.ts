import BigNumber from "bignumber.js";
import { polkadotMainnetConfigValue } from "../test/config.fixture";
import * as sidecar from "./sidecar";
import network from ".";

jest.mock("./sidecar");
const mockedSidecar = jest.mocked(sidecar);

const currencyId = "polkadot";
const config = polkadotMainnetConfigValue;
const logger = jest.fn();

describe("getMetadata", () => {
  afterEach(() => {
    mockedSidecar.getMetadata.mockClear();
  });

  it("should pass callData, includedInExtrinsic, includedInSignedData and currency id to sidecar", async () => {
    mockedSidecar.getMetadata.mockResolvedValueOnce({
      metadataBlob: "0xmetadatablob",
      metadataHash: "0xmetadatahash",
    });

    const callData = "0x0a0300abcdef";
    const includedInExtrinsic = "0xf50020000001";
    const includedInSignedData = "0x" + "aa".repeat(105);

    const result = await network.getMetadata(
      config,
      callData,
      includedInExtrinsic,
      includedInSignedData,
      currencyId,
    );

    expect(result).toEqual({ metadataBlob: "0xmetadatablob", metadataHash: "0xmetadatahash" });
    expect(mockedSidecar.getMetadata).toHaveBeenCalledTimes(1);
    expect(mockedSidecar.getMetadata).toHaveBeenCalledWith(
      config,
      callData,
      includedInExtrinsic,
      includedInSignedData,
      currencyId,
    );
  });
});

describe("getMinimumBondBalance", () => {
  afterEach(() => {
    mockedSidecar.getMinimumBondBalance.mockClear();
  });

  it("is called once due to cache", async () => {
    mockedSidecar.getMinimumBondBalance.mockResolvedValueOnce(new BigNumber("12"));
    let minBond = await network.getMinimumBondBalance(config, currencyId);
    expect(minBond).toEqual(new BigNumber("12"));
    expect(mockedSidecar.getMinimumBondBalance).toHaveBeenCalledTimes(1);

    // This new value should never been called as the previous one is cached
    mockedSidecar.getMinimumBondBalance.mockResolvedValueOnce(new BigNumber("13"));
    minBond = await network.getMinimumBondBalance(config, currencyId);
    expect(minBond).toEqual(new BigNumber("12"));
    expect(mockedSidecar.getMinimumBondBalance).toHaveBeenCalledTimes(1);
  });

  it("is called again once the configured TTL has elapsed", async () => {
    const shortLivedConfig = {
      ...config,
      sidecar: { ...config.sidecar, minimumBondCacheTtlMs: 10 },
    };
    mockedSidecar.getMinimumBondBalance.mockResolvedValue(new BigNumber("12"));

    await network.getMinimumBondBalance(shortLivedConfig, currencyId);
    await new Promise(resolve => setTimeout(resolve, 50));
    await network.getMinimumBondBalance(shortLivedConfig, currencyId);

    expect(mockedSidecar.getMinimumBondBalance).toHaveBeenCalledTimes(2);
  });
});

describe("getStakingProgress", () => {
  afterEach(() => {
    mockedSidecar.getStakingProgress.mockClear();
  });

  it("is called once due to cache", async () => {
    const progress = {
      activeEra: 1,
      electionClosed: true,
      maxNominatorRewardedPerValidator: 512,
      bondingDuration: 28,
    };
    mockedSidecar.getStakingProgress.mockResolvedValueOnce(progress);
    let result = await network.getStakingProgress(logger, config, currencyId);
    expect(result).toEqual(progress);
    expect(mockedSidecar.getStakingProgress).toHaveBeenCalledTimes(1);

    // Second call for the same currency is served from cache
    mockedSidecar.getStakingProgress.mockResolvedValueOnce({ ...progress, activeEra: 2 });
    result = await network.getStakingProgress(logger, config, currencyId);
    expect(result.activeEra).toEqual(1);
    expect(mockedSidecar.getStakingProgress).toHaveBeenCalledTimes(1);
  });

  it("forwards the injected logger to the sidecar", async () => {
    mockedSidecar.getStakingProgress.mockResolvedValue({
      activeEra: 3,
      electionClosed: true,
      maxNominatorRewardedPerValidator: 512,
      bondingDuration: 28,
    });

    await network.getStakingProgress(logger, config, "westend");

    expect(mockedSidecar.getStakingProgress).toHaveBeenCalledWith(logger, config, "westend");
  });
});

describe("getValidators", () => {
  afterEach(() => {
    mockedSidecar.getValidators.mockClear();
  });

  it("caches per (status, currency) key", async () => {
    mockedSidecar.getValidators.mockResolvedValue([]);

    await network.getValidators(config, "all", currencyId);
    await network.getValidators(config, "all", currencyId);
    // Same status + currency → cached, sidecar hit only once
    expect(mockedSidecar.getValidators).toHaveBeenCalledTimes(1);

    // Different status → different cache key → new sidecar call
    await network.getValidators(config, "elected", currencyId);
    expect(mockedSidecar.getValidators).toHaveBeenCalledTimes(2);
  });
});

describe("isNewAccount", () => {
  afterEach(() => {
    mockedSidecar.isNewAccount.mockClear();
  });

  it("is called once due to cache", async () => {
    mockedSidecar.isNewAccount.mockResolvedValueOnce(false);
    let isNewAccount = await network.isNewAccount(config, "0xfff", currencyId);
    expect(isNewAccount).toEqual(false);
    expect(mockedSidecar.isNewAccount).toHaveBeenCalledTimes(1);
    expect(mockedSidecar.getMinimumBondBalance).toHaveBeenCalledTimes(0);

    // This new value should never been called as the previous one is cached
    mockedSidecar.isNewAccount.mockResolvedValueOnce(true);
    isNewAccount = await network.isNewAccount(config, "0xfff", currencyId);
    expect(isNewAccount).toEqual(false);
    expect(mockedSidecar.isNewAccount).toHaveBeenCalledTimes(1);
    expect(mockedSidecar.getMinimumBondBalance).toHaveBeenCalledTimes(0);
  });
});
