import React from "react";
import { Text } from "react-native";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "@tests/test-renderer";
import { OsUpdateStateSheet } from ".";

// Wraps the real sheet to observe the props the OS update sheet configures it with.
jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  return { ...actual, QueuedBottomSheet: jest.fn(actual.QueuedBottomSheet) };
});

const sheetProps = () => jest.mocked(QueuedBottomSheet).mock.lastCall?.[0];

describe("OsUpdateStateSheet", () => {
  beforeEach(() => {
    jest.mocked(QueuedBottomSheet).mockClear();
  });

  it("renders its children", () => {
    render(
      <OsUpdateStateSheet isOpen>
        <Text>sheet content</Text>
      </OsUpdateStateSheet>,
    );

    expect(screen.getByText("sheet content")).toBeVisible();
  });

  it.each([true, false])("requests the sheet to be open when isOpen is %s", isOpen => {
    render(
      <OsUpdateStateSheet isOpen={isOpen}>
        <Text>sheet content</Text>
      </OsUpdateStateSheet>,
    );

    expect(sheetProps()?.isRequestingToBeOpened).toBe(isOpen);
  });

  it("is dismissable by the header cross and the backdrop when it can be cancelled", () => {
    const onClose = jest.fn();
    render(
      <OsUpdateStateSheet isOpen onClose={onClose}>
        <Text>sheet content</Text>
      </OsUpdateStateSheet>,
    );

    expect(sheetProps()).toMatchObject({
      onHeaderClosePressed: onClose,
      onBackdropPress: onClose,
      noCloseButton: false,
      preventBackdropClick: false,
    });
  });

  it("hides the header cross, but keeps the backdrop dismissal, without a header", () => {
    const onClose = jest.fn();
    render(
      <OsUpdateStateSheet isOpen onClose={onClose} hideHeader>
        <Text>sheet content</Text>
      </OsUpdateStateSheet>,
    );

    expect(sheetProps()).toMatchObject({
      onBackdropPress: onClose,
      noCloseButton: true,
      preventBackdropClick: false,
    });
  });

  it("cannot be dismissed when there is nothing to cancel", () => {
    render(
      <OsUpdateStateSheet isOpen>
        <Text>sheet content</Text>
      </OsUpdateStateSheet>,
    );

    expect(sheetProps()).toMatchObject({
      onHeaderClosePressed: undefined,
      onBackdropPress: undefined,
      noCloseButton: true,
      preventBackdropClick: true,
    });
  });

  it.each([undefined, jest.fn()])("never closes on a pan-down gesture (onClose: %s)", onClose => {
    render(
      <OsUpdateStateSheet isOpen onClose={onClose}>
        <Text>sheet content</Text>
      </OsUpdateStateSheet>,
    );

    expect(sheetProps()?.enablePanDownToClose).toBe(false);
  });
});
