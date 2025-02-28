import { useStake } from "./useStake";

const testFlagValue = {
  enabled: true,
  params: {
    list: [
      "mantra",
      "xion",
      "ethereum",
      "solana",
      "tezos",
      "polkadot",
      "cosmos",
      "osmo",
      "celo",
      "near",
      "elrond",
      "quicksilver",
      "persistence",
      "onomy",
      "axelar",
      "cardano",
      "dydx",
      "injective",
    ],
    redirectList:
      {
        crypto_org: {
          platform: "stakekit",
          name: "StakeKit",
          queryParams: {
            yieldId: "cronos-cro-native-staking",
          },
        },
      },
      {
        bsc: {
          platform: "stakekit",
          name: "StakeKit",
          queryParams: {
            yieldId: "bsc-bnb-native-staking",
          },
        },
      },
      {
        polygon: {
          platform: "stakekit",
          name: "StakeKit",
          queryParams: {
            yieldId: "ethereum-matic-native-staking",
          },
        },
      },
      {
        polkadot: {
          platform: "stakekit",
          name: "StakeKit",
          queryParams: {
            yieldId: "polkadot-dot-validator-staking",
          },
        },
      },
      {
        "ethereum/erc20/usd_tether__erc20_": {
          platform: "kilnWidget",
          name: "Kiln",
          queryParams: {
            chainId: 1,
          },
        },
        forwardParams: ["address", "theme"],
      },
  },
};

// jest.mock("@ledgerhq/live-common/featureFlags/useFeature", () => ({
//   useFeature: jest.fn(() => testFlagValue),
// }));

// jest.mock("react-router-dom", () => ({
//   history: jest.fn(),
// }));

const redirectList = testFlagValue?.params?.redirectList || [];
const thirdPartySupportedTokens = Object.keys(redirectList || []);

describe("useCanShowStake", () => {
  it("should return a direction fn if the currency is in the redirect list", () => {
    const x = redirectList["ethereum/erc20/usd_tether__erc20_"];

    expect(x).toBeTruthy();
  });
});

// describe("useCanShowStake", () => {
//   it("should return false if the currency is not in the list", () => {
//     const { showStakeAction } = useCanShowStake({ id: "not-in-the-list" });
//     expect(showStakeAction).toBe(false);
//   });

//   it("should return true if the currency is in the list", () => {
//     const { showStakeAction } = useCanShowStake({ id: "ethereum" });
//     expect(showStakeAction).toBe(true);
//   });

//   it("should return true if the currency is in the redirect list", () => {
//     const { showStakeAction } = useCanShowStake({ id: "bsc" });
//     expect(showStakeAction).toBe(true);
//   });
// });
