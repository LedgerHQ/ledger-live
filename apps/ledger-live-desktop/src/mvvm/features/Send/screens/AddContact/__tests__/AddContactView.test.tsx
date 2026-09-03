/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { AddContactView } from "../AddContactView";
import useLedgerSyncEntryPointViewModel from "LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel";
import SendFlowEntryPoint from "src/mvvm/features/LedgerSyncEntryPoints/components/SendFlowEntryPoint";
import { useSendFlowActions } from "../../../context/SendFlowContext";

jest.mock("LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel");
const mockLedgerSyncEntryPointViewModel = useLedgerSyncEntryPointViewModel as jest.Mock;

jest.mock("../../../context/SendFlowContext", () => ({
  useSendFlowActions: jest.fn().mockReturnValue({ close: jest.fn() }),
}));
const mockUseSendFlowActions = useSendFlowActions as jest.Mock;

function renderAddContactView(props?: Partial<React.ComponentProps<typeof AddContactView>>) {
  return render(
    <AddContactView onAddNewContact={jest.fn()} onAddToExistingContact={jest.fn()} {...props} />,
  );
}

describe("AddContactView", () => {
  const ledgerSyncEntryPointViewModel = {
    shouldDisplayEntryPoint: false,
    entryPointComponent: null,
    openDrawer: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLedgerSyncEntryPointViewModel.mockReturnValue(ledgerSyncEntryPointViewModel);
  });

  it("renders both add contact options", () => {
    renderAddContactView();

    expect(screen.getByTestId("send-add-contact-new")).toBeInTheDocument();
    expect(screen.getByTestId("send-add-contact-existing")).toBeInTheDocument();

    expect(ledgerSyncEntryPointViewModel.shouldDisplayEntryPoint).toEqual(false);
    expect(ledgerSyncEntryPointViewModel.entryPointComponent).toEqual(null);
    expect(ledgerSyncEntryPointViewModel.openDrawer).not.toHaveBeenCalled();
  });

  it.each([
    ["send-add-contact-new", "onAddNewContact"],
    ["send-add-contact-existing", "onAddToExistingContact"],
  ] as const)("calls the %s handler when clicked", (testId, handlerName) => {
    const handler = jest.fn();
    renderAddContactView({ [handlerName]: handler });

    screen.getByTestId(testId).click();

    expect(handler).toHaveBeenCalled();

    expect(ledgerSyncEntryPointViewModel.shouldDisplayEntryPoint).toEqual(false);
    expect(ledgerSyncEntryPointViewModel.entryPointComponent).toEqual(null);
    expect(ledgerSyncEntryPointViewModel.openDrawer).not.toHaveBeenCalled();
  });

  it("should render Ledger Sync activation when user can activate it", () => {
    const ledgerSyncViewModel = {
      shouldDisplayEntryPoint: true,
      entryPointComponent: () => <SendFlowEntryPoint onPress={jest.fn()} />,
      openDrawer: jest.fn(),
    };

    mockLedgerSyncEntryPointViewModel.mockReturnValue(ledgerSyncViewModel);

    renderAddContactView();

    expect(screen.getByTestId("send-add-contact-sync-wallet-step")).toBeInTheDocument();
    expect(screen.getByTestId("send-flow-sync-wallet")).toBeInTheDocument();
    expect(screen.getByTestId("send-add-contact-sync-wallet-later")).toBeInTheDocument();

    expect(screen.queryByTestId("send-add-contact-new")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-add-contact-existing")).not.toBeInTheDocument();
  });

  it("should continue adding contact when user dont want to activate Ledger Sync", async () => {
    const ledgerSyncViewModel = {
      shouldDisplayEntryPoint: true,
      entryPointComponent: () => <SendFlowEntryPoint onPress={jest.fn()} />,
      openDrawer: jest.fn(),
    };

    mockLedgerSyncEntryPointViewModel.mockReturnValue(ledgerSyncViewModel);

    const { user } = renderAddContactView();

    expect(screen.getByTestId("send-add-contact-sync-wallet-step")).toBeInTheDocument();
    expect(screen.getByTestId("send-flow-sync-wallet")).toBeInTheDocument();
    expect(screen.getByTestId("send-add-contact-sync-wallet-later")).toBeInTheDocument();

    expect(screen.queryByTestId("send-add-contact-new")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-add-contact-existing")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Not now" }));

    expect(screen.queryByTestId("send-add-contact-sync-wallet-step")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-flow-sync-wallet")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-add-contact-sync-wallet-later")).not.toBeInTheDocument();

    expect(screen.queryByTestId("send-add-contact-new")).toBeInTheDocument();
    expect(screen.queryByTestId("send-add-contact-existing")).toBeInTheDocument();
  });

  it("should close the view when the user want to activate Ledger Sync", async () => {
    const sendFlowActions = {
      close: jest.fn(),
    };
    mockUseSendFlowActions.mockReturnValue(sendFlowActions);

    const openDrawer = jest.fn();

    const ledgerSyncViewModel = {
      shouldDisplayEntryPoint: true,
      entryPointComponent: () => (
        <SendFlowEntryPoint
          onPress={() => {
            sendFlowActions.close();
            openDrawer();
          }}
        />
      ),
      openDrawer,
    };

    mockLedgerSyncEntryPointViewModel.mockReturnValue(ledgerSyncViewModel);

    const { user } = renderAddContactView();

    expect(screen.getByTestId("send-add-contact-sync-wallet-step")).toBeInTheDocument();
    expect(screen.getByTestId("send-flow-sync-wallet")).toBeInTheDocument();
    expect(screen.getByTestId("send-add-contact-sync-wallet-later")).toBeInTheDocument();

    expect(screen.queryByTestId("send-add-contact-new")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-add-contact-existing")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("send-flow-sync-wallet"));

    expect(sendFlowActions.close).toHaveBeenCalled();
    expect(sendFlowActions.close).toHaveBeenCalledTimes(1);

    expect(ledgerSyncViewModel.openDrawer).toHaveBeenCalled();
    expect(ledgerSyncViewModel.openDrawer).toHaveBeenCalledTimes(1);
  });
});
