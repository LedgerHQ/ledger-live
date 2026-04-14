import React from "react";
import { render } from "tests/testSetup";
import { screen } from "@testing-library/react";
import { ActionConfirmationDialog } from "../index";
import {
  getActionDialogSnapshot,
  subscribeActionDialog,
  resolveActionDialog,
} from "~/renderer/components/WebPTXPlayer/actionDialogStore";

jest.mock("~/renderer/components/WebPTXPlayer/actionDialogStore", () => ({
  getActionDialogSnapshot: jest.fn(),
  subscribeActionDialog: jest.fn(),
  resolveActionDialog: jest.fn(),
}));

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const React = require("react");
  return {
    Dialog: ({
      children,
      open,
      onOpenChange,
    }: {
      children: React.ReactNode;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }) => (
      <div data-testid="dialog" data-open={open}>
        {children}
        <button data-testid="dialog-backdrop" onClick={() => onOpenChange(false)}>
          backdrop
        </button>
      </div>
    ),
    DialogContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-content">{children}</div>
    ),
    DialogHeader: ({ onClose }: { onClose?: () => void }) => (
      <button data-testid="dialog-header-close" onClick={onClose}>
        close
      </button>
    ),
    Spot: ({ appearance }: { appearance: string }) => (
      <div data-testid={`spot-${appearance}`} />
    ),
    Button: ({
      children,
      onClick,
    }: {
      children: React.ReactNode;
      onClick: () => void;
    }) => (
      <button data-testid="confirm-button" onClick={onClick}>
        {children}
      </button>
    ),
  };
});

const mockedGetSnapshot = jest.mocked(getActionDialogSnapshot);
const mockedSubscribe = jest.mocked(subscribeActionDialog);
const mockedResolve = jest.mocked(resolveActionDialog);

function setupSubscribeMock() {
  mockedSubscribe.mockImplementation((listener: () => void) => {
    // useSyncExternalStore calls subscribe; return unsubscribe
    return () => {};
  });
}

describe("ActionConfirmationDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSubscribeMock();
  });

  it("returns null when there is no dialog data", () => {
    mockedGetSnapshot.mockReturnValue(null);

    const { container } = render(<ActionConfirmationDialog />, { skipRouter: true });

    expect(container.querySelector("[data-testid='dialog']")).toBeNull();
  });

  it("renders dialog with title, description, and CTA when data is present", () => {
    mockedGetSnapshot.mockReturnValue({
      title: "Swap required",
      description: "You need to swap first",
      ctaLabel: "Go to Swap",
    });

    render(<ActionConfirmationDialog />, { skipRouter: true });

    expect(screen.getByText("Swap required")).toBeInTheDocument();
    expect(screen.getByText("You need to swap first")).toBeInTheDocument();
    expect(screen.getByText("Go to Swap")).toBeInTheDocument();
  });

  it("renders spot with info appearance by default", () => {
    mockedGetSnapshot.mockReturnValue({
      title: "Title",
      description: "Desc",
      ctaLabel: "OK",
    });

    render(<ActionConfirmationDialog />, { skipRouter: true });

    expect(screen.getByTestId("spot-info")).toBeInTheDocument();
  });

  it("renders spot with warning appearance when icon is warning", () => {
    mockedGetSnapshot.mockReturnValue({
      title: "Title",
      description: "Desc",
      ctaLabel: "OK",
      icon: "warning",
    });

    render(<ActionConfirmationDialog />, { skipRouter: true });

    expect(screen.getByTestId("spot-warning")).toBeInTheDocument();
  });

  it("renders spot with check appearance when icon is success", () => {
    mockedGetSnapshot.mockReturnValue({
      title: "Title",
      description: "Desc",
      ctaLabel: "OK",
      icon: "success",
    });

    render(<ActionConfirmationDialog />, { skipRouter: true });

    expect(screen.getByTestId("spot-check")).toBeInTheDocument();
  });

  it("calls resolveActionDialog(true) when confirm button is clicked", async () => {
    mockedGetSnapshot.mockReturnValue({
      title: "Title",
      description: "Desc",
      ctaLabel: "Confirm",
    });

    const { user } = render(<ActionConfirmationDialog />, { skipRouter: true });

    await user.click(screen.getByTestId("confirm-button"));

    expect(mockedResolve).toHaveBeenCalledWith(true);
  });

  it("calls resolveActionDialog(false) when close header is clicked", async () => {
    mockedGetSnapshot.mockReturnValue({
      title: "Title",
      description: "Desc",
      ctaLabel: "OK",
    });

    const { user } = render(<ActionConfirmationDialog />, { skipRouter: true });

    await user.click(screen.getByTestId("dialog-header-close"));

    expect(mockedResolve).toHaveBeenCalledWith(false);
  });

  it("calls resolveActionDialog(false) when dialog is dismissed via onOpenChange", async () => {
    mockedGetSnapshot.mockReturnValue({
      title: "Title",
      description: "Desc",
      ctaLabel: "OK",
    });

    const { user } = render(<ActionConfirmationDialog />, { skipRouter: true });

    await user.click(screen.getByTestId("dialog-backdrop"));

    expect(mockedResolve).toHaveBeenCalledWith(false);
  });
});
