import React from "react";
import { act } from "@testing-library/react";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { render, screen } from "tests/testSetup";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { HEDERA_ACCOUNT_1 } from "../__mocks__/account.mock";
import Body from "./Body";
import { HederaCustomModal } from "../constants";
import ReceiveWithAssociationModal from "./index";

jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: jest.fn(),
}));

jest.mock("./Body", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => <div data-testid="receive-body" />),
}));

const mockBody = jest.mocked(Body);
const mockOpenAssetFlow = jest.fn();

const getBodyProps = () => mockBody.mock.lastCall?.[0];

describe("ReceiveWithAssociationModal", () => {
  const openedModalState = {
    modals: {
      [HederaCustomModal.RECEIVE_WITH_ASSOCIATION]: {
        isOpened: true,
        data: {},
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useOpenAssetFlow).mockReturnValue({
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
            [HederaCustomModal.RECEIVE_WITH_ASSOCIATION]: { isOpened: true, data: {} },
          },
        },
      });

      expect(useOpenAssetFlow).toHaveBeenCalledTimes(1);
      expect(useOpenAssetFlow).toHaveBeenCalledWith(
        { location: ModularDrawerLocation.ADD_ACCOUNT },
        "receive",
        HederaCustomModal.RECEIVE_WITH_ASSOCIATION,
      );
      expect(mockOpenAssetFlow).toHaveBeenCalledTimes(1);
      expect(store.getState().modals[HederaCustomModal.RECEIVE_WITH_ASSOCIATION]).toEqual({
        isOpened: false,
      });
    });
  });

  describe("when accounts exist", () => {
    it("should render the Body when the modal is open", () => {
      render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT_1],
          ...openedModalState,
        },
      });

      expect(screen.getByTestId("receive-body")).toBeInTheDocument();
    });

    it("should not render the Body when the modal is closed", () => {
      render(<ReceiveWithAssociationModal />, {
        initialState: { accounts: [HEDERA_ACCOUNT_1] },
      });

      expect(screen.queryByTestId("receive-body")).not.toBeInTheDocument();
    });

    it("should allow Escape key to close the modal when not in a locked step", async () => {
      const { store, user } = render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT_1],
          ...openedModalState,
        },
      });

      await user.keyboard("{Escape}");

      expect(store.getState().modals[HederaCustomModal.RECEIVE_WITH_ASSOCIATION]).toEqual({
        isOpened: false,
      });
    });

    it.each(["associationDevice", "associationConfirmation"] as const)(
      "should prevent Escape key from closing modal in %s step",
      async stepId => {
        const { store, user } = render(<ReceiveWithAssociationModal />, {
          initialState: {
            accounts: [HEDERA_ACCOUNT_1],
            ...openedModalState,
          },
        });

        act(() => getBodyProps()?.onChangeStepId?.(stepId));

        await user.keyboard("{Escape}");

        expect(store.getState().modals[HederaCustomModal.RECEIVE_WITH_ASSOCIATION]).toEqual({
          isOpened: true,
          data: {},
        });
      },
    );

    it("should prevent Escape key from closing modal in receive step before address is verified", async () => {
      const { store, user } = render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT_1],
          ...openedModalState,
        },
      });

      act(() => getBodyProps()?.onChangeStepId?.("receive"));

      await user.keyboard("{Escape}");

      expect(store.getState().modals[HederaCustomModal.RECEIVE_WITH_ASSOCIATION]).toEqual({
        isOpened: true,
        data: {},
      });
    });

    it("should allow Escape key to close modal in receive step once address is verified", async () => {
      const { store, user } = render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT_1],
          ...openedModalState,
        },
      });

      act(() => getBodyProps()?.onChangeStepId?.("receive"));
      act(() => getBodyProps()?.onChangeAddressVerified?.(true));

      await user.keyboard("{Escape}");

      expect(store.getState().modals[HederaCustomModal.RECEIVE_WITH_ASSOCIATION]).toEqual({
        isOpened: false,
      });
    });

    it("should reset state to 'account' step on modal hide", () => {
      const { store } = render(<ReceiveWithAssociationModal />, {
        initialState: {
          accounts: [HEDERA_ACCOUNT_1],
          ...openedModalState,
        },
      });

      act(() => getBodyProps()?.onChangeStepId?.("device"));

      // Simulate modal close then reopen to confirm reset
      act(() => {
        store.dispatch({
          type: "MODAL_CLOSE",
          payload: { name: HederaCustomModal.RECEIVE_WITH_ASSOCIATION },
        });
      });
      act(() => {
        store.dispatch({
          type: "MODAL_OPEN",
          payload: { name: HederaCustomModal.RECEIVE_WITH_ASSOCIATION, data: {} },
        });
      });

      // After hide+reopen, Body receives the initial stepId again
      expect(getBodyProps()).toMatchObject({ stepId: "account" });
    });
  });
});
