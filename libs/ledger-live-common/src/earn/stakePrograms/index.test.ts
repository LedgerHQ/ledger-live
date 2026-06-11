import type { Features } from "@shared/feature-flags";
import { stakeProgramsToEarnParam } from "./index";

const feature_stake_programs_empty_json: Features["stakePrograms"] = {
  enabled: true,
  params: {
    list: ["injective", "ethereum"],
    redirects: {},
  },
};

const feature_stake_programs_json: Features["stakePrograms"] = {
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

describe("stakeProgramsToEarnParam", () => {
  it("should return `undefined` when there are no redirects", () => {
    const { stakeProgramsParam } = stakeProgramsToEarnParam(feature_stake_programs_empty_json);
    expect(stakeProgramsParam).toEqual(undefined);
  });

  it("should return a record of stake earn params", () => {
    const { stakeProgramsParam } = stakeProgramsToEarnParam(feature_stake_programs_json);
    expect(stakeProgramsParam).toEqual({
      "ethereum/erc20/usd__coin": "kiln-widget",
      "ethereum/erc20/usd_tether__erc20_": "earn",
      tron: "stakekit",
    });
  });
});
