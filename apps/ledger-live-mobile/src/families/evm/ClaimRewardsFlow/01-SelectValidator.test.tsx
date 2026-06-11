import BigNumber from "bignumber.js";
import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import type { Account } from "@ledgerhq/types-live";
import type { StakingMappedDelegation } from "@ledgerhq/live-common/families/evm/staking/types";
import ClaimRewardsSelectValidator from "./01-SelectValidator";

const account = {
  id: "evm-sei_evm-1",
  type: "Account",
  currency: {
    family: "evm",
    id: "sei_evm",
    ticker: "SEI",
    units: [{ code: "SEI", magnitude: 18 }],
  },
  freshAddress: "0x0000000000000000000000000000000000000001",
  stakingResources: { delegations: [], unbondings: [], redelegations: [] },
} as unknown as Account;

const makeDelegation = (name: string, pendingRewards: BigNumber): StakingMappedDelegation =>
  ({
    validatorAddress: `seivaloper1${name.toLowerCase()}`,
    pendingRewards,
    amount: new BigNumber("1e18"),
    formattedAmount: "1 SEI",
    formattedPendingRewards: pendingRewards.toString(),
    rank: 0,
    validator: {
      validatorAddress: `seivaloper1${name.toLowerCase()}`,
      name,
      votingPower: 0,
      commission: 0.05,
      estimatedYearlyRewardsRate: 0.1,
      tokens: "0",
    },
  }) as unknown as StakingMappedDelegation;

const makeUnresolvedDelegation = (
  name: string,
  pendingRewards: BigNumber,
): StakingMappedDelegation =>
  ({
    validatorAddress: `seivaloper1${name.toLowerCase()}`,
    validatorId: "7",
    validatorName: name,
    pendingRewards,
    amount: new BigNumber("1e18"),
    formattedAmount: "1 SEI",
    formattedPendingRewards: pendingRewards.toString(),
    rank: -1,
    validator: undefined,
  }) as unknown as StakingMappedDelegation;

// A delegation whose validator IS matched in the loaded list, but that matched
// validator carries no validatorId (the loaded validator list is paginated and
// does not always populate it). The delegation itself holds the authoritative
// validatorId from sync.
const makeMatchedDelegationWithoutValidatorIdOnValidator = (
  name: string,
  validatorId: string,
  pendingRewards: BigNumber,
): StakingMappedDelegation =>
  ({
    validatorAddress: `seivaloper1${name.toLowerCase()}`,
    validatorId,
    validatorName: name,
    pendingRewards,
    amount: new BigNumber("1e18"),
    formattedAmount: "1 SEI",
    formattedPendingRewards: pendingRewards.toString(),
    rank: 0,
    validator: {
      validatorAddress: `seivaloper1${name.toLowerCase()}`,
      name,
      votingPower: 0,
      commission: 0.05,
      estimatedYearlyRewardsRate: 0.1,
      tokens: "0",
    },
  }) as unknown as StakingMappedDelegation;

const mockNavigate = jest.fn();
const mockDelegations: StakingMappedDelegation[] = [];

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { accountId: account.id } }),
}));
jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account, parentAccount: undefined }),
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "SEI", magnitude: 18 }),
}));
jest.mock("@ledgerhq/live-common/families/evm/staking/types", () => ({
  isStakingAccount: () => true,
}));
jest.mock("@ledgerhq/live-common/families/evm/staking/react", () => ({
  useEvmFamilyMappedDelegations: () => mockDelegations,
}));

describe("EVM ClaimRewardsSelectValidator screen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockDelegations.length = 0;
  });

  it("lists only delegations with pendingRewards > 0", () => {
    mockDelegations.push(
      makeDelegation("Alpha", new BigNumber("0.5e18")),
      makeDelegation("Beta", new BigNumber(0)),
      makeDelegation("Gamma", new BigNumber("0.3e18")),
    );
    render(<ClaimRewardsSelectValidator />);
    expect(screen.getByText("Alpha")).toBeOnTheScreen();
    expect(screen.getByText("Gamma")).toBeOnTheScreen();
    expect(screen.queryByText("Beta")).toBeNull();
  });

  it("navigates to Claim with validator + value when a row is tapped", () => {
    mockDelegations.push(makeDelegation("Alpha", new BigNumber("0.5e18")));
    render(<ClaimRewardsSelectValidator />);
    fireEvent.press(screen.getByText("Alpha"));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringMatching(/Claim$/),
      expect.objectContaining({ validator: expect.objectContaining({ name: "Alpha" }) }),
    );
  });

  it("renders delegations whose validator has not resolved using their validatorName", () => {
    mockDelegations.push(makeUnresolvedDelegation("Delta", new BigNumber("0.2e18")));
    render(<ClaimRewardsSelectValidator />);
    expect(screen.getByText("Delta")).toBeOnTheScreen();
  });

  it("navigates with a validator built from the delegation when the validator is unresolved", () => {
    mockDelegations.push(makeUnresolvedDelegation("Delta", new BigNumber("0.2e18")));
    render(<ClaimRewardsSelectValidator />);
    fireEvent.press(screen.getByText("Delta"));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringMatching(/Claim$/),
      expect.objectContaining({
        validator: expect.objectContaining({
          validatorAddress: "seivaloper1delta",
          validatorId: "7",
          name: "Delta",
        }),
      }),
    );
  });

  it("carries the delegation's validatorId even when the matched validator lacks one", () => {
    mockDelegations.push(
      makeMatchedDelegationWithoutValidatorIdOnValidator("Epsilon", "23", new BigNumber("0.4e18")),
    );
    render(<ClaimRewardsSelectValidator />);
    fireEvent.press(screen.getByText("Epsilon"));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringMatching(/Claim$/),
      expect.objectContaining({
        validator: expect.objectContaining({ name: "Epsilon", validatorId: "23" }),
      }),
    );
  });
});
