import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, waitFor } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import type { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import type { HederaValidatorsQuery } from "@ledgerhq/live-common/families/hedera/react";
import { makeHederaAccount } from "../../__mocks__/account.mock";
import type { StepProps } from "../types";

let mockValidatorsQuery: HederaValidatorsQuery;

jest.mock("@ledgerhq/live-common/families/hedera/react", () => ({
  useHederaValidators: () => mockValidatorsQuery,
}));

import StepSummary from "../steps/StepSummary";

const defaultState = { settings: AFTER_ONBOARDING_STATE };

const validator = {
  id: "3",
  name: "Hedera Node 3",
  address: "0.0.3",
  addressChecksum: null,
  minStake: new BigNumber(0),
  maxStake: new BigNumber(0),
  activeStake: new BigNumber(0),
  activeStakePercentage: new BigNumber(0),
  overstaked: false,
  isLedgerNode: false,
};

const makeAccount = (): HederaAccount =>
  makeHederaAccount({
    delegation: { nodeId: 3, delegated: new BigNumber(0), pendingReward: new BigNumber(0) },
  });

const makeProps = (): StepProps =>
  ({
    t: (key: string) => key,
    account: makeAccount(),
    parentAccount: null,
    transaction: {},
    status: { errors: {}, warnings: {} },
    error: null,
  }) as unknown as StepProps;

describe("UndelegationFlowModal/StepSummary", () => {
  it("does not show the removed-validator placeholder while the validator list fetch is still failing", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: new Error("network down") };

    render(<StepSummary {...makeProps()} />, { initialState: defaultState });

    await waitFor(() => expect(screen.getByText(/unable to load validators/i)).toBeVisible());
    expect(
      screen.queryByText(/previously selected validator is no longer available/i),
    ).not.toBeInTheDocument();
  });

  it("shows the removed-validator placeholder once the fetch succeeds and the validator is gone", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: null };

    render(<StepSummary {...makeProps()} />, { initialState: defaultState });

    await waitFor(() =>
      expect(
        screen.getByText(/previously selected validator is no longer available/i),
      ).toBeVisible(),
    );
  });

  it("shows the validator name once the fetch succeeds and the validator is still present", async () => {
    mockValidatorsQuery = { validators: [validator], loading: false, error: null };

    render(<StepSummary {...makeProps()} />, { initialState: defaultState });

    await waitFor(() => expect(screen.getByText("Hedera Node 3")).toBeVisible());
  });
});
