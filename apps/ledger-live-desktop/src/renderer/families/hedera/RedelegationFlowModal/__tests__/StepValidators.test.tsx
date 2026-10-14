import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, waitFor } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import type { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import type { HederaValidatorsQuery } from "@ledgerhq/live-common/families/hedera/react";
import { makeHederaAccount } from "../../__mocks__/account.mock";
import { makeHederaTransaction } from "../../__mocks__/transaction.mock";
import StepValidators from "../steps/StepValidators";
import type { StepProps } from "../types";

let mockValidatorsQuery: HederaValidatorsQuery;

jest.mock("@ledgerhq/live-common/families/hedera/react", () => ({
  useHederaValidators: () => mockValidatorsQuery,
  useHederaEnrichedDelegation: () => ({
    loading: false,
    error: null,
    validator: { id: "3", address: "0.0.3" },
  }),
}));

jest.mock("@ledgerhq/live-common/bridge/impl", () => ({
  __esModule: true,
  getAccountBridge: () => require("../../__mocks__/bridge.mock").resolvedAccountBridge,
  getCurrencyBridge: () => require("../../__mocks__/bridge.mock").resolvedCurrencyBridge,
}));

const defaultState = { settings: AFTER_ONBOARDING_STATE };

const makeAccount = (): HederaAccount =>
  makeHederaAccount({
    delegation: { nodeId: 3, delegated: new BigNumber(0), pendingReward: new BigNumber(0) },
  });

const makeProps = (overrides: Partial<StepProps> = {}): StepProps =>
  ({
    t: (key: string) => key,
    account: makeAccount(),
    parentAccount: null,
    transaction: makeHederaTransaction({ mode: "redelegate" }),
    status: { errors: {}, warnings: {} },
    error: null,
    onUpdateTransaction: jest.fn(),
    ...overrides,
  }) as unknown as StepProps;

describe("RedelegationFlowModal/StepValidators", () => {
  it("renders the fetch error once even though two selects read it", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: new Error("network down") };

    render(<StepValidators {...makeProps()} />, { initialState: defaultState });

    await waitFor(() => expect(screen.getAllByText(/network down/i)).toHaveLength(1));
    expect(screen.getAllByText(/unable to load validators/i)).toHaveLength(2);
  });

  it("renders the stakingNodeId error under the new validator select", async () => {
    mockValidatorsQuery = { validators: [], loading: false, error: null };

    render(
      <StepValidators
        {...makeProps({
          transaction: makeHederaTransaction({ mode: "redelegate", valId: "3" }),
          status: {
            errors: {
              stakingNodeId: Object.assign(new Error(), {
                name: "HederaRedundantStakingNodeIdError",
              }),
            },
            warnings: {},
          } as unknown as StepProps["status"],
        })}
      />,
      { initialState: defaultState },
    );

    expect(await screen.findByText(/already delegating to this node/i)).toBeVisible();
  });
});
