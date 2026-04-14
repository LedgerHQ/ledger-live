import React from "react";
import { act } from "@testing-library/react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { render, screen } from "tests/testSetup";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import ReceiveWithAssociationModal from "../index";
import type { StepId } from "../types";

type CapturedBodyProps = {
  stepId: StepId;
  onChangeStepId: (stepId: StepId) => void;
  onChangeAddressVerified: (isAddressVerified?: boolean | null, err?: Error | null) => void;
};

let capturedBodyProps: CapturedBodyProps | undefined;

jest.mock("../Body", () => ({
  __esModule: true,
  default: jest.fn((props: CapturedBodyProps) => {
    capturedBodyProps = props;
    return <div data-testid="receive-body" />;
  }),
}));

jest.mock("~/renderer/analytics/hooks/useTrackReceiveFlow", () => ({
  useTrackReceiveFlow: jest.fn(),
}));

jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: jest.fn(),
}));

const mockUseOpenAssetFlow = jest.mocked(useOpenAssetFlow);
let mockOpenAssetFlow: jest.Mock;

const hederaCurrency = getCryptoCurrencyById("hedera");
const HEDERA_ACCOUNT = genAccount("hedera-receive-test-1", { currency: hederaCurrency });

const openedModalState = {
  modals: {
    MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION: {
      isOpened: true,
      data: {},
    },
  },
};

describe("ReceiveWithAssociationModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedBodyProps = undefined;
    mockOpenAssetFlow = jest.fn();
    mockUseOpenAssetFlow.mockReturnValue({
      openAssetFlow: mockOpenAssetFlow,
      openAddAccountFlow: jest.fn(),
    });

    const modalsDiv = document.createElement("div");
    modalsDiv.id = "modals";
    document.body.appendChild(modalsDiv);
  });

  afterEach(() => {
    document.getElementById("modals")?.remove();
  });

  describe("when no accounts exist", () => {
    it("should render nothing", () => {
      render(<ReceiveWithAssociationModal />, {
        initialState: { accounts: [] },
      });

      expect(screen.queryByTestId("receive-body")).not.toBeInTheDocument();
    });

    it("should call openAssetFlow and close the Hedera receive modal when no accounts exist", () => {
      const { store } = render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [],
          modals: {
            MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION: { isOpened: true, data: {} },
          },
        },
      });

      expect(mockOpenAssetFlow).toHaveBeenCalledTimes(1);
      expect(store.getState().modals.MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION).toEqual({
        isOpened: false,
      });
    });

    it("should configure useOpenAssetFlow with ADD_ACCOUNT location and modal name", () => {
      render(<ReceiveWithAssociationModal />, {
        initialState: { accounts: [] },
      });

      expect(mockUseOpenAssetFlow).toHaveBeenCalledWith(
        { location: ModularDrawerLocation.ADD_ACCOUNT },
        "receive",
      );
    });
  });

  describe("when accounts exist", () => {
    it("should render the Body when the modal is open", () => {
      render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT],
          ...openedModalState,
        },
      });

      expect(screen.getByTestId("receive-body")).toBeInTheDocument();
    });

    it("should not render the Body when the modal is closed", () => {
      render(<ReceiveWithAssociationModal />, {
        initialState: { accounts: [HEDERA_ACCOUNT] },
      });

      expect(screen.queryByTestId("receive-body")).not.toBeInTheDocument();
    });

    it("should pass the initial stepId 'account' to Body", () => {
      render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT],
          ...openedModalState,
        },
      });

      expect(capturedBodyProps).toMatchObject({ stepId: "account" });
    });

    it("should allow Escape key to close the modal when not in a locked step", async () => {
      const { store, user } = render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT],
          ...openedModalState,
        },
      });

      await user.keyboard("{Escape}");

      expect(store.getState().modals.MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION).toEqual({
        isOpened: false,
      });
    });

    it("should prevent Escape key from closing the modal during associationDevice step", async () => {
      const { store, user } = render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT],
          ...openedModalState,
        },
      });

      act(() => capturedBodyProps?.onChangeStepId("associationDevice"));

      await user.keyboard("{Escape}");

      expect(store.getState().modals.MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION).toEqual({
        isOpened: true,
        data: {},
      });
    });

    it("should reset state to 'account' step on modal hide", () => {
      const { store } = render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT],
          ...openedModalState,
        },
      });

      act(() => capturedBodyProps?.onChangeStepId("device"));

      // Simulate modal close then reopen to confirm reset
      act(() => {
        store.dispatch({
          type: "MODAL_CLOSE",
          payload: { name: "MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION" },
        });
      });
      act(() => {
        store.dispatch({
          type: "MODAL_OPEN",
          payload: { name: "MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION", data: {} },
        });
      });

      // After hide+reopen, Body receives the initial stepId again
      expect(capturedBodyProps).toMatchObject({ stepId: "account" });
    });

    it("should prevent Escape key from closing modal in associationConfirmation step", async () => {
      const { store, user } = render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT],
          ...openedModalState,
        },
      });

      act(() => capturedBodyProps?.onChangeStepId("associationConfirmation"));

      await user.keyboard("{Escape}");

      expect(store.getState().modals.MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION).toEqual({
        isOpened: true,
        data: {},
      });
    });

    it("should prevent Escape key from closing modal in receive step before address is verified", async () => {
      const { store, user } = render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT],
          ...openedModalState,
        },
      });

      act(() => capturedBodyProps?.onChangeStepId("receive"));
      // isAddressVerified starts as null — receive lock is active
      act(() => capturedBodyProps?.onChangeAddressVerified(null));

      await user.keyboard("{Escape}");

      expect(store.getState().modals.MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION).toEqual({
        isOpened: true,
        data: {},
      });
    });
  });
});
