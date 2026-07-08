import React from "react";
import { fireEvent } from "@testing-library/react";
import { render, screen, waitFor } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type {
  StakingAccount,
  StakingValidatorItem,
} from "@ledgerhq/live-common/families/evm/staking/types";
import * as evmStakingReact from "@ledgerhq/live-common/families/evm/staking/react";
import ValidatorField from "../ValidatorField";

jest.mock("@ledgerhq/live-common/families/evm/staking/react");
jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn(),
}));

const ethereum = getCryptoCurrencyById("ethereum");

const account = {
  type: "Account",
  currency: ethereum,
} as unknown as StakingAccount;

const makeValidator = (index: number): StakingValidatorItem => ({
  validatorAddress: `0x${index.toString().padStart(40, "0")}`,
  name: `Validator ${index}`,
  votingPower: 1,
  commission: 0.05,
  estimatedYearlyRewardsRate: 0.04,
  tokens: "0",
});

const makeValidators = (count: number) =>
  Array.from({ length: count }, (_, index) => makeValidator(index));

const mockedUseEvmStakingValidators = jest.mocked(evmStakingReact.useEvmStakingValidators);

const mockValidatorsState = (
  overrides: Partial<ReturnType<typeof evmStakingReact.useEvmStakingValidators>> = {},
) =>
  mockedUseEvmStakingValidators.mockReturnValue({
    validators: [],
    loading: false,
    error: null,
    ...overrides,
  } as ReturnType<typeof evmStakingReact.useEvmStakingValidators>);

const defaultProps = {
  account,
  onChangeValidator: jest.fn(),
  chosenVoteAccAddr: "",
};

describe("EVM RedelegationFlowModal ValidatorField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useAccountUnit } = jest.requireMock("~/renderer/hooks/useAccountUnit");
    useAccountUnit.mockReturnValue(ethereum.units[0]);
  });

  it("should render one row per validator returned by the hook", () => {
    mockValidatorsState({ validators: makeValidators(3) });

    render(<ValidatorField {...defaultProps} />);

    expect(screen.getByText("Validator 0")).toBeVisible();
    expect(screen.getByText("Validator 1")).toBeVisible();
    expect(screen.getByText("Validator 2")).toBeVisible();
  });

  it("should exclude the source validator passed via excludeAddress", () => {
    const validators = makeValidators(3);
    mockValidatorsState({ validators });

    render(<ValidatorField {...defaultProps} excludeAddress={validators[1].validatorAddress} />);

    expect(screen.getByText("Validator 0")).toBeVisible();
    expect(screen.queryByText("Validator 1")).not.toBeInTheDocument();
    expect(screen.getByText("Validator 2")).toBeVisible();
  });

  it("should call onChangeValidator with the address when a validator is clicked", async () => {
    const validators = makeValidators(2);
    mockValidatorsState({ validators });
    const onChangeValidator = jest.fn();

    const { user } = render(
      <ValidatorField {...defaultProps} onChangeValidator={onChangeValidator} />,
    );

    // clicking the title only opens the explorer (it stops propagation), so click the row itself
    const row = screen.getByText("Validator 1").closest('[data-testid="modal-provider-row"]');
    await user.click(row as HTMLElement);

    expect(onChangeValidator).toHaveBeenCalledTimes(1);
    expect(onChangeValidator).toHaveBeenCalledWith(validators[1].validatorAddress);
  });

  it("should forward the search input to the hook", async () => {
    mockValidatorsState({ validators: makeValidators(1) });

    const { user } = render(<ValidatorField {...defaultProps} />);

    await user.type(screen.getByRole("textbox"), "abc");

    // last render receives the full search string
    expect(mockedUseEvmStakingValidators).toHaveBeenLastCalledWith("ethereum", "abc");
  });

  it("should render the error banner when the hook returns an error", () => {
    mockValidatorsState({ error: new Error("network down") });

    render(<ValidatorField {...defaultProps} />);

    expect(screen.getByText("network down")).toBeVisible();
  });

  it("should show the no-results placeholder when the list is empty and not loading", () => {
    mockValidatorsState({ validators: [], loading: false });

    render(<ValidatorField {...defaultProps} />);

    expect(screen.getByText(t => t.toLowerCase().includes("no validators"))).toBeInTheDocument();
  });

  it("should not show the no-results placeholder while loading", () => {
    mockValidatorsState({ validators: [], loading: true });

    render(<ValidatorField {...defaultProps} />);

    expect(
      screen.queryByText(t => t.toLowerCase().includes("no validators")),
    ).not.toBeInTheDocument();
  });

  describe("scroll pagination", () => {
    it("should render only the first buffer of validators, then load more on scroll", async () => {
      // bufferSize in ScrollLoadingList is 20, so only the first 20 render initially
      mockValidatorsState({ validators: makeValidators(25) });

      const { container } = render(<ValidatorField {...defaultProps} />);

      expect(screen.getByText("Validator 19")).toBeVisible();
      expect(screen.queryByText("Validator 20")).not.toBeInTheDocument();
      expect(screen.queryByText("Validator 24")).not.toBeInTheDocument();

      // The scroll container is the last child of the ValidatorsSection wrapper
      const section = container.firstChild as HTMLElement;
      const scrollContainer = section.lastElementChild as HTMLElement;

      // Simulate a real scroll position near the bottom so the threshold logic is exercised.
      Object.defineProperty(scrollContainer, "scrollHeight", { value: 1000, configurable: true });
      Object.defineProperty(scrollContainer, "offsetHeight", { value: 500, configurable: true });
      Object.defineProperty(scrollContainer, "scrollTop", {
        value: 400,
        configurable: true,
        writable: true,
      });

      fireEvent.scroll(scrollContainer);

      // onScroll is debounced by 50ms, so wait for the extra rows to appear
      await waitFor(() => expect(screen.getByText("Validator 24")).toBeVisible());
    });
  });
});
