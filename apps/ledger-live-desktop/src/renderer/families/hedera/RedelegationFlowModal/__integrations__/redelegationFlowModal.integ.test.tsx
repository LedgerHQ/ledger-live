import React from "react";
import BigNumber from "bignumber.js";
import { act, render, screen, waitFor } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { HEDERA_DELEGATION_STATUS } from "@ledgerhq/live-common/families/hedera/constants";
import RedelegationModal from "../index";
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
    {
      nodeId: 5,
      name: "Hedera Node 5",
      address: "0.0.5",
      addressChecksum: null,
      minStake: new BigNumber(0),
      maxStake: new BigNumber(250_000_000_000_000_000),
      activeStake: new BigNumber(0),
      activeStakePercentage: new BigNumber(0),
      overstaked: false,
    },
  ]),
  useHederaEnrichedDelegation: jest.fn(() => ({
    nodeId: 0,
    delegated: new BigNumber(5_000_000_000),
    pendingReward: new BigNumber(500_000),
    status: HEDERA_DELEGATION_STATUS.Active,
    validator: {
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
  })),
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
beforeEach(async () => {
  await setupHederaModalTest();
});

afterEach(() => {
  cleanupHederaModalTest();
});

function setupModal() {
  createModalsContainer();

  return render(<RedelegationModal />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      modals: {
        MODAL_HEDERA_REDELEGATION: {
          isOpened: true,
          data: { account: HEDERA_ACCOUNT_1 },
        },
      },
    },
  });
}

describe("Hedera RedelegationFlowModal (integration)", () => {
  it("completes the happy path: Validators → ConnectDevice → Confirmation success", async () => {
    setupModal();

    await clickContinueWhenEnabled();

    await act(async () => {
      subjectRefs.sign.next({ type: "signed", signedOperation: mockSignedOperation as never });
    });

    await waitFor(
      () => expect(screen.getByText("You have successfully redelegated your assets")).toBeVisible(),
      { timeout: 5000 },
    );
  });

  it("shows the device error state and allows retry when signing fails", async () => {
    setupModal();

    await clickContinueWhenEnabled();

    await act(async () => {
      subjectRefs.sign.error(new Error("UserRefusedOnDevice"));
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /retry/i })).toBeVisible());
  });
});
