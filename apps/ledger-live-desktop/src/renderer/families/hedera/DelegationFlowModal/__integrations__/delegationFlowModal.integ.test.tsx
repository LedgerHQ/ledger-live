import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen, waitFor } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { getEnv, setEnv } from "@shared/env";
import DelegationModal from "../index";
import { HEDERA_ACCOUNT_1 } from "../../__mocks__/account.mock";
import { mockSignedOperation } from "../../__mocks__/signedOperation.mock";
import { subjectRefs } from "../../__mocks__/bridge.mock";
import {
  createModalsContainer,
  setupHederaModalTest,
  cleanupHederaModalTest,
  clickContinueWhenEnabled,
} from "../../__mocks__/flowHelpers";

jest.mock("@ledgerhq/live-common/families/hedera/react", () => ({
  useHederaValidators: jest.fn(() => [
    {
      nodeId: 0,
      name: "Hedera Node 0",
      address: "0.0.3",
      addressChecksum: null,
      minStake: new BigNumber(0),
      maxStake: new BigNumber(250_000_000_000_000_000),
      activeStake: new BigNumber(0),
      activeStakePercentage: new BigNumber(0),
      overstaked: false,
    },
  ]),
  useHederaEnrichedDelegation: jest.fn(() => null),
}));

jest.mock("@ledgerhq/live-common/hw/actions/app", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/actions/app"),
  createAction: () => {
    const { mockAppState, mockDevice } = require("../../__mocks__/bridge.mock");
    return {
      useHook: () => mockAppState,
      mapResult: () => ({ device: mockDevice }),
    };
  },
}));

jest.mock("@ledgerhq/live-common/bridge/impl", () => ({
  __esModule: true,
  getAccountBridge: () => require("../../__mocks__/bridge.mock").resolvedAccountBridge,
  getCurrencyBridge: () => require("../../__mocks__/bridge.mock").resolvedCurrencyBridge,
}));

let prevLedgerNodeId: number;
beforeEach(async () => {
  prevLedgerNodeId = getEnv("HEDERA_STAKING_LEDGER_NODE_ID");
  // nodeId 0 matches the first mocked validator so getDefaultValidator pre-selects it,
  // enabling the Continue button on the Validator step without user interaction.
  setEnv("HEDERA_STAKING_LEDGER_NODE_ID", 0);
  await setupHederaModalTest();
});

afterEach(() => {
  setEnv("HEDERA_STAKING_LEDGER_NODE_ID", prevLedgerNodeId);
  cleanupHederaModalTest();
});

function setupModal() {
  createModalsContainer();

  return render(<DelegationModal />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      modals: {
        MODAL_HEDERA_DELEGATION: {
          isOpened: true,
          data: { account: HEDERA_ACCOUNT_1 },
        },
      },
    },
  });
}

describe("Hedera DelegationFlowModal (integration)", () => {
  it("completes the happy path: Validator → Amount → ConnectDevice → Confirmation success", async () => {
    setupModal();

    await clickContinueWhenEnabled();
    await clickContinueWhenEnabled();

    await act(async () => {
      subjectRefs.sign.next({ type: "signed", signedOperation: mockSignedOperation as never });
    });

    await waitFor(
      () => expect(screen.getByText("You have successfully delegated your assets")).toBeVisible(),
      { timeout: 5000 },
    );
  }, 20_000);

  it("shows the device error state and allows retry when signing fails", async () => {
    setupModal();

    await clickContinueWhenEnabled();
    await clickContinueWhenEnabled();

    await act(async () => {
      subjectRefs.sign.error(new Error("UserRefusedOnDevice"));
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /retry/i })).toBeVisible());
  });
});
