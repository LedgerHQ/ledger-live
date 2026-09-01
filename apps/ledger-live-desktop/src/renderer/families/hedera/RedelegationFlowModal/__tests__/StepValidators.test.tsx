import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, waitFor } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import type { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import { makeHederaAccount } from "../../__mocks__/account.mock";
import { makeHederaTransaction } from "../../__mocks__/transaction.mock";
import StepValidators from "../steps/StepValidators";
import type { StepProps } from "../types";

let queryFn: () => Promise<unknown>;

jest.mock("@ledgerhq/live-common/families/hedera/react", () => ({
  hederaQueries: {
    validatorsList: () => ({
      queryKey: ["mock-hedera-validators"],
      queryFn: () => queryFn(),
      retry: false,
    }),
  },
  useHederaEnrichedDelegationV2: () => ({
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

const makeProps = (): StepProps =>
  ({
    t: (key: string) => key,
    account: makeAccount(),
    parentAccount: null,
    transaction: makeHederaTransaction({ mode: HEDERA_TRANSACTION_MODES.Redelegate }),
    status: { errors: {}, warnings: {} },
    error: null,
    onUpdateTransaction: jest.fn(),
  }) as unknown as StepProps;

describe("RedelegationFlowModal/StepValidators", () => {
  it("shows the fetch error only once when both selects hit a failing fetch", async () => {
    queryFn = () => Promise.reject(new Error("network down"));

    render(<StepValidators {...makeProps()} />, { initialState: defaultState });

    await waitFor(() => expect(screen.getAllByText(/network down/i)).toHaveLength(1));
    expect(screen.getAllByText(/unable to load validators/i)).toHaveLength(2);
  });
});
