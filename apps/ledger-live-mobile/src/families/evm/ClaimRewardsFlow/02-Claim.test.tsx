import BigNumber from "bignumber.js";
import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { ClaimRewardsFeesWarning } from "@ledgerhq/errors";
import type { Account } from "@ledgerhq/types-live";
import type { StakingValidatorItem } from "@ledgerhq/live-common/families/evm/staking/types";
import ClaimRewardsClaim from "./02-Claim";

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
} as unknown as Account;

const validator: StakingValidatorItem = {
  validatorAddress: "seivaloper1xyz",
  name: "Test Validator",
  votingPower: 0,
  commission: 0.05,
  estimatedYearlyRewardsRate: 0.1,
  tokens: "0",
};

const mockNavigate = jest.fn();
const mockStatus: { errors: object; warnings: object; estimatedFees: BigNumber } = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
};
const fakeTx = {};

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account, parentAccount: undefined }),
}));
jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "SEI", magnitude: 18 }),
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({}),
    updateTransaction: (t: object) => t,
  }),
}));
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => ({
    transaction: fakeTx,
    status: mockStatus,
    bridgePending: false,
    bridgeError: null,
  }),
}));

describe("EVM ClaimRewardsClaim screen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockStatus.errors = {};
    mockStatus.warnings = {};
  });

  it("renders the rewards amount and validator name", () => {
    render(
      <ClaimRewardsClaim
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={
          { params: { accountId: account.id, validator, value: new BigNumber("0.5e18") } } as any
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={{ navigate: mockNavigate } as any}
      />,
    );
    expect(screen.getByText(validator.name)).toBeOnTheScreen();
    expect(screen.getByText(/0\.5\sSEI/)).toBeOnTheScreen();
  });

  it("shows the fees-exceed-rewards warning when bridge returns it", () => {
    mockStatus.warnings = { claimRewardsFee: new ClaimRewardsFeesWarning() };
    render(
      <ClaimRewardsClaim
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={{ params: { accountId: account.id, validator, value: new BigNumber(100) } } as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={{ navigate: mockNavigate } as any}
      />,
    );
    expect(
      screen.getByText("The rewards are smaller than the estimated fees to claim them."),
    ).toBeOnTheScreen();
  });

  it("disables Continue when the bridge returns errors", () => {
    mockStatus.errors = { fees: new Error("NotEnoughBalance") };
    render(
      <ClaimRewardsClaim
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={{ params: { accountId: account.id, validator, value: new BigNumber(100) } } as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={{ navigate: mockNavigate } as any}
      />,
    );
    expect(screen.getByText("Continue")).toBeDisabled();
  });

  it("navigates to SelectDevice on Continue", () => {
    render(
      <ClaimRewardsClaim
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={{ params: { accountId: account.id, validator, value: new BigNumber(100) } } as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={{ navigate: mockNavigate } as any}
      />,
    );
    fireEvent.press(screen.getByText("Continue"));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringMatching(/SelectDevice/),
      expect.objectContaining({ validator, value: expect.any(BigNumber) }),
    );
  });
});
