import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import StepSummary from "./StepSummary";

const mockStakingInfo: { unstakedBalance: BigNumber; delegateAddress: string | undefined } = {
  unstakedBalance: new BigNumber(0),
  delegateAddress: undefined,
};

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useTezosStakingInfo: () => mockStakingInfo,
  useDelegation: () => null,
  useStakingPositions: () => [],
  useBaker: () => null,
}));

jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "XTZ", name: "tez", magnitude: 6 }),
}));

// Analytics reads broad store state we don't seed; irrelevant to the warning.
jest.mock("~/renderer/analytics/TrackPage", () => () => null);

// Body layout is irrelevant to the footer warning under test.
jest.mock("../DelegationContainer", () => () => null);
jest.mock("../../BakerImage", () => () => null);

const currency = getCryptoCurrencyById("tezos");

const makeProps = ({ recipient = "tz1NEW", mode = "delegate" } = {}) =>
  ({
    account: {
      type: "Account",
      id: "js:2:tezos:tz1acc:",
      currency,
      balance: new BigNumber(100),
      spendableBalance: new BigNumber(100),
    },
    transaction: { family: "tezos", mode, recipient },
    status: { errors: {}, warnings: {} },
    transitionTo: jest.fn(),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  }) as unknown as React.ComponentProps<typeof StepSummary>;

describe("Tezos delegate StepSummary — pending-unstake warning", () => {
  beforeEach(() => {
    mockStakingInfo.unstakedBalance = new BigNumber(0);
    mockStakingInfo.delegateAddress = undefined;
  });

  it("warns when a pending unstake exists and a different validator is selected", () => {
    mockStakingInfo.unstakedBalance = new BigNumber(5);
    mockStakingInfo.delegateAddress = "tz1OLD";
    render(<StepSummary {...makeProps({ recipient: "tz1NEW" })} />);
    expect(screen.getByTestId("tezos-pending-unstake-warning")).toBeInTheDocument();
  });

  it("does not warn without a pending unstake", () => {
    mockStakingInfo.unstakedBalance = new BigNumber(0);
    mockStakingInfo.delegateAddress = "tz1OLD";
    render(<StepSummary {...makeProps({ recipient: "tz1NEW" })} />);
    expect(screen.queryByTestId("tezos-pending-unstake-warning")).not.toBeInTheDocument();
  });

  it("does not warn when the selected validator is unchanged", () => {
    mockStakingInfo.unstakedBalance = new BigNumber(5);
    mockStakingInfo.delegateAddress = "tz1SAME";
    render(<StepSummary {...makeProps({ recipient: "tz1SAME" })} />);
    expect(screen.queryByTestId("tezos-pending-unstake-warning")).not.toBeInTheDocument();
  });
});
