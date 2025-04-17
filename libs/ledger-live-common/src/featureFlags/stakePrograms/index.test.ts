import { Feature_StakePrograms } from "@ledgerhq/types-live";
import { stakeProgramsToEarnParam } from "./index";

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
        name: "",
      },
      "ethereum/erc20/usd_tether__erc20_": {
        platform: "earn",
        name: "",
      },
      tron: {
        platform: "stakekit",
        name: "",
        queryParams: {
          yieldId: "tron-native-staking",
        },
      },
    },
  },
};

describe("stakeProgramToEarnParam", () => {
  it("should return `undefined` when there are no redirects", () => {
    const result = stakeProgramsToEarnParam(feature_stake_programs_empty_json);
    expect(result).toEqual(undefined);
  });

  it("should return a record of stake earn params", () => {
    const result = stakeProgramsToEarnParam(feature_stake_programs_json);
    expect(result).toEqual({
      "ethereum/erc20/usd__coin": "kiln-widget",
      "ethereum/erc20/usd_tether__erc20_": "earn",
      tron: "stakekit",
    });
  });
});
