import React from "react";
import { act, render, screen, userEvent, waitFor } from "tests/testSetup";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import ReceiveWithAssociationModal from "../index";
import { HEDERA_ACCOUNT_1 } from "../../__mocks__/account.mock";
import { subjectRefs } from "../../__mocks__/bridge.mock";
import { mockSignedOperation } from "../../__mocks__/signedOperation.mock";
import {
  createModalsContainer,
  setupHederaModalTest,
  cleanupHederaModalTest,
} from "../../__mocks__/flowHelpers";

const mockHtsToken = {
  id: "hedera/hts/0.0.123456",
  name: "Mock HTS Token",
  ticker: "MHT",
  contractAddress: "0.0.123456",
  decimals: 8,
  type: "TokenCurrency" as const,
  tokenType: "hts" as const,
  parentCurrency: { id: "hedera", family: "hedera" } as never,
  units: [{ code: "MHT", name: "Mock HTS Token", magnitude: 8 }],
  disableCountervalue: false,
};

jest.mock("@ledgerhq/live-common/families/hedera/utils", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/hedera/utils"),
  isTokenAssociationRequired: jest.fn(() => true),
}));

// Mock StepAccount to auto-call onChangeToken so isMissingToken = false when receiveTokenMode = true
jest.mock("~/renderer/modals/Receive/steps/StepAccount", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onChangeToken }: { onChangeToken?: (t: unknown) => void }) => {
      React.useEffect(() => {
        if (onChangeToken) {
          onChangeToken({
            id: "hedera/hts/0.0.123456",
            name: "Mock HTS Token",
            ticker: "MHT",
            contractAddress: "0.0.123456",
            decimals: 8,
            type: "TokenCurrency",
          });
        }
      }, [onChangeToken]);
      return <div data-testid="step-account">Select Account</div>;
    },
  };
});

// StepAssociationDevice uses hw/actions/transaction (not hw/actions/app), which isn't set up
// in this harness. This mock preserves the real sign→broadcast→transition sequence while
// driving it via subjectRefs.sign, the same pattern used by other Hedera modal integration tests.
jest.mock("../steps/StepAssociationDevice", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({
      transitionTo,
      onOperationBroadcasted,
      setSigned,
    }: {
      transitionTo: (id: string) => void;
      onOperationBroadcasted: (op: unknown) => void;
      setSigned: (v: boolean) => void;
    }) => {
      React.useEffect(() => {
        const { subjectRefs, mockAccountBridge } = require("../../__mocks__/bridge.mock");
        const sub = subjectRefs.sign.subscribe(
          async (event: { type: string; signedOperation: unknown }) => {
            if (event.type === "signed") {
              setSigned(true);
              const op = await mockAccountBridge.broadcast({
                signedOperation: event.signedOperation,
              });
              onOperationBroadcasted(op);
              transitionTo("associationConfirmation");
            }
          },
        );
        return () => sub.unsubscribe();
      }, [setSigned, onOperationBroadcasted, transitionTo]);
      return <div data-testid="step-association-device">Connecting device…</div>;
    },
  };
});

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

function setupModal(data: Record<string, unknown> = {}) {
  createModalsContainer();

  return render(<ReceiveWithAssociationModal />, {
    initialState: {
      settings: AFTER_ONBOARDING_STATE,
      accounts: [HEDERA_ACCOUNT_1],
      modals: {
        MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION: {
          isOpened: true,
          data: { account: HEDERA_ACCOUNT_1, ...data },
        },
      },
    },
  });
}

describe("Hedera ReceiveWithAssociationModal (integration)", () => {
  it("renders the account step when opened with a pre-selected account", async () => {
    setupModal();

    await waitFor(() => expect(screen.getByTestId("step-account")).toBeVisible());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled(),
    );
  });

  it("association path: Account → AssociationDevice → Confirmation shows 'Transaction sent'", async () => {
    setupModal({ receiveTokenMode: true, token: mockHtsToken });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    await act(async () => {
      subjectRefs.sign.next({ type: "signed", signedOperation: mockSignedOperation as never });
    });

    await waitFor(() => expect(screen.getByText("Transaction sent")).toBeVisible(), {
      timeout: 5000,
    });
  });
});
