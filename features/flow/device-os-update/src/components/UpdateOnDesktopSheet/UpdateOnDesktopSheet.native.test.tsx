import React from "react";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "../../__tests__/render";
import { UpdateOnDesktopSheet } from "./UpdateOnDesktopSheet";

jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  return { ...actual, QueuedBottomSheet: jest.fn(actual.QueuedBottomSheet) };
});

const sheetProps = () => jest.mocked(QueuedBottomSheet).mock.lastCall?.[0];

const props = {
  isOpen: true,
  page: "portfolio",
  productName: "Ledger Nano X",
  analyticsModelId: "nanoX",
  wired: false,
};

describe("UpdateOnDesktopSheet", () => {
  beforeEach(() => {
    jest.mocked(QueuedBottomSheet).mockClear();
  });

  it("is not requested while closed", () => {
    render(<UpdateOnDesktopSheet {...props} isOpen={false} onClose={jest.fn()} />);

    expect(sheetProps()?.isRequestingToBeOpened).toBe(false);
  });

  it("tells the user to update from desktop, naming the device", () => {
    render(<UpdateOnDesktopSheet {...props} onClose={jest.fn()} />);

    expect(screen.getByText("Update on your computer")).toBeVisible();
    expect(
      screen.getByText(
        "Your Ledger Nano X needs a one-time update that can only be installed from Ledger Wallet on desktop.",
      ),
    ).toBeVisible();
  });

  it("has no header cross, and closes from got it and from a tap outside", async () => {
    const onClose = jest.fn();
    const { user } = render(<UpdateOnDesktopSheet {...props} onClose={onClose} />);

    expect(sheetProps()).toMatchObject({ noCloseButton: true, preventBackdropClick: false });
    sheetProps()?.onBackdropPress?.();
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.press(screen.getByText("Got it"));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
