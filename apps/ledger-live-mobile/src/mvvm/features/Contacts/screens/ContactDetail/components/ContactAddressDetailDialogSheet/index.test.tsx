import React from "react";
import { render } from "@tests/test-renderer";
import type { ContactAddressDetailDialogNativeProps } from "@features/flow-contacts";
import { ContactAddressDetailDialogSheet } from ".";

const queuedBottomSheetProps = jest.fn();

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
  QueuedBottomSheet: (props: Record<string, unknown>) => {
    queuedBottomSheetProps(props);
    return null;
  },
}));

const dialogProps = {
  contactName: "Ben",
  labels: { formatNetworkTag: (name: string) => name },
  onClose: () => undefined,
} as unknown as ContactAddressDetailDialogNativeProps;

describe("ContactAddressDetailDialogSheet", () => {
  beforeEach(() => {
    queuedBottomSheetProps.mockClear();
  });

  it("should request to be opened when an address is selected", () => {
    render(<ContactAddressDetailDialogSheet {...dialogProps} isOpen isActionSheetOpen={false} />);

    expect(queuedBottomSheetProps).toHaveBeenCalledWith(
      expect.objectContaining({ isRequestingToBeOpened: true }),
    );
  });

  // Staying in the queue behind an action sheet is what left an empty sheet on screen: the queue
  // promotes whatever is waiting before React has seen that the selection is gone.
  it("should stop requesting to be opened while an action sheet is open", () => {
    render(<ContactAddressDetailDialogSheet {...dialogProps} isOpen isActionSheetOpen />);

    expect(queuedBottomSheetProps).toHaveBeenCalledWith(
      expect.objectContaining({ isRequestingToBeOpened: false }),
    );
  });
});
