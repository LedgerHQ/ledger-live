import React from "react";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "@tests/test-renderer";
import { CloseConfirmation } from ".";

// Wraps the real sheet to observe the props the confirmation configures it with.
jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  return { ...actual, QueuedBottomSheet: jest.fn(actual.QueuedBottomSheet) };
});

const sheetProps = () => jest.mocked(QueuedBottomSheet).mock.lastCall?.[0];

describe("CloseConfirmation", () => {
  beforeEach(() => {
    jest.mocked(QueuedBottomSheet).mockClear();
  });

  it("is not requested while closed", () => {
    render(<CloseConfirmation isOpen={false} onContinue={jest.fn()} onCancel={jest.fn()} />);

    expect(sheetProps()?.isRequestingToBeOpened).toBe(false);
  });

  it("is requested and shows the warning when open", () => {
    render(<CloseConfirmation isOpen onContinue={jest.fn()} onCancel={jest.fn()} />);

    expect(sheetProps()?.isRequestingToBeOpened).toBe(true);
    expect(screen.getByText("OS update is in progress")).toBeVisible();
  });

  it("has no header cross, and a tap outside continues the update", () => {
    const onContinue = jest.fn();
    render(<CloseConfirmation isOpen onContinue={onContinue} onCancel={jest.fn()} />);

    expect(sheetProps()).toMatchObject({
      noCloseButton: true,
      onBackdropPress: onContinue,
      preventBackdropClick: false,
    });
  });

  it("continues the update on the primary action", async () => {
    const onContinue = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <CloseConfirmation isOpen onContinue={onContinue} onCancel={onCancel} />,
    );

    await user.press(screen.getByTestId("os-update-close-confirmation-continue"));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancels the update on the secondary action", async () => {
    const onContinue = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <CloseConfirmation isOpen onContinue={onContinue} onCancel={onCancel} />,
    );

    await user.press(screen.getByTestId("os-update-close-confirmation-cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
  });
});
