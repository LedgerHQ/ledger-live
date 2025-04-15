import { customRenderHookWithLiveAppProvider as renderHook } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { useEarnStakeProgramsParam } from "./useEarnStakeProgramsParam";
import { Feature_StakePrograms } from "@ledgerhq/types-live";

const feature_stake_programs_empty_json: Feature_StakePrograms = {
  enabled: true,
  params: {
    list: ["injective", "ethereum"],
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
      "ethereum/erc20/usd_tether__erc20_": {
        platform: "earn",
        name: "",
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
    const { result } = renderHook(() => useEarnStakeProgramsParam(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          overriddenFeatureFlags: {
            stakePrograms: feature_stake_programs_empty_json,
          },
        },
      }),
    });

    expect(result.current).toEqual(undefined);
  });

  it("should return a record of coins to app ids", () => {
    const { result } = renderHook(() => useEarnStakeProgramsParam(), {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          overriddenFeatureFlags: {
            stakePrograms: feature_stake_programs_json,
          },
        },
      }),
    });

    expect(result.current).toEqual({
      "ethereum/erc20/usd__coin": "kiln-widget",
      "ethereum/erc20/usd_tether__erc20_": "earn",
      tron: "stakekit",
    });
  });
});
