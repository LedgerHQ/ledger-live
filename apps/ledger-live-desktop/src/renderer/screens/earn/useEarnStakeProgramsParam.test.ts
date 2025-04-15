import { renderHookWithLiveAppProvider } from "tests/testSetup";
import { useEarnStakeProgramsParam } from "./useEarnStakeProgramsParam";
import { Feature_StakePrograms } from "@ledgerhq/types-live";

const feature_stake_programs_empty_json: Feature_StakePrograms = {
  enabled: true,
  params: {
    list: ["injective"],
    redirects: {},
  },
};

const feature_stake_programs_json: Feature_StakePrograms = {
  enabled: true,
  params: {
    list: ["injective"],
    redirects: {
      "ethereum/erc20/usd__coin": {
        platform: "kiln-widget",
        name: "Dapp",
        queryParams: {
          yieldId: "kiln",
        },
      },
      tron: {
        platform: "stakekit",
        name: "Live App",
        queryParams: {
          yieldId: "tron-native-staking",
        },
      },
    },
  },
};

describe("useEarnStakeProgramsParam", () => {
  it("should return `undefined` when there are no redirects", () => {
    const { result } = renderHookWithLiveAppProvider(() => useEarnStakeProgramsParam(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            stakePrograms: feature_stake_programs_empty_json,
          },
        },
      },
    });

    expect(result.current).toEqual(undefined);
  });

  it("should return a record of stake earn params", () => {
    const { result } = renderHookWithLiveAppProvider(() => useEarnStakeProgramsParam(), {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            stakePrograms: feature_stake_programs_json,
          },
        },
      },
    });

    expect(result.current).toEqual({
      tron: "mock-dapp-v1", // "earn"
      "ethereum/erc20/usd_tether__erc20_": "mock-dapp-v3",
      "ethereum/erc20/usd__coin": "mock-dapp-v1",
    });
  });
});
