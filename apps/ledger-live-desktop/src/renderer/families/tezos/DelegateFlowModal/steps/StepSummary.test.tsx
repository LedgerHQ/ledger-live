import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import StepSummary from "./StepSummary";

const mockStakingInfo: { unstakingPositions: { uid: string; delegate?: string }[] } = {
  unstakingPositions: [],
};

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useTezosStakingInfo: () => mockStakingInfo,
  useDelegation: () => null,
  useStakingPositions: () => [],
  useBaker: () => null,
  isUnstakingPosition: (uid: string) => uid.startsWith("unstaking-"),
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
    mockStakingInfo.unstakingPositions = [];
  });

  it("warns when an unfinalizable unstake to a different validator is pending", () => {
    mockStakingInfo.unstakingPositions = [{ uid: "unstaking-1", delegate: "tz1OLD" }];
    render(<StepSummary {...makeProps({ recipient: "tz1NEW" })} />);
    expect(screen.getByTestId("tezos-pending-unstake-warning")).toBeVisible();
  });

  it("does not warn without a pending unstake", () => {
    mockStakingInfo.unstakingPositions = [];
    render(<StepSummary {...makeProps({ recipient: "tz1NEW" })} />);
    expect(screen.queryByTestId("tezos-pending-unstake-warning")).not.toBeInTheDocument();
  });

  it("does not warn when the selected validator matches the pending unstake's delegate", () => {
    mockStakingInfo.unstakingPositions = [{ uid: "unstaking-1", delegate: "tz1SAME" }];
    render(<StepSummary {...makeProps({ recipient: "tz1SAME" })} />);
    expect(screen.queryByTestId("tezos-pending-unstake-warning")).not.toBeInTheDocument();
  });

  it("does not warn when the unstake is already finalizable", () => {
    mockStakingInfo.unstakingPositions = [{ uid: "finalizable-1", delegate: "tz1OLD" }];
    render(<StepSummary {...makeProps({ recipient: "tz1NEW" })} />);
    expect(screen.queryByTestId("tezos-pending-unstake-warning")).not.toBeInTheDocument();
  });
});
