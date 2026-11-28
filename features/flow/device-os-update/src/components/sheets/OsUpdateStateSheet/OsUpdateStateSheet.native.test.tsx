import React from "react";
import { Pressable, Text } from "react-native";
import { render as renderOutsideProviders } from "@testing-library/react-native";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { render, screen } from "../../../__tests__/render";
import { useOsUpdatePorts } from "../../../hooks/OsUpdatePortsProvider";
import {
  OsUpdateTrackingContext,
  useOsUpdateTracking,
} from "../../../hooks/OsUpdateTrackingProvider";
import { OsUpdateButton } from "../../../analytics/analyticsTypes";
import { OsUpdateStateSheet } from "./OsUpdateStateSheet";

// Wraps the real sheet to observe the props the OS update sheet configures it with.
jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  return { ...actual, QueuedBottomSheet: jest.fn(actual.QueuedBottomSheet) };
});

const sheetProps = () => jest.mocked(QueuedBottomSheet).mock.lastCall?.[0];

function SupportButton() {
  const { openSupport } = useOsUpdatePorts();
  const { trackClick } = useOsUpdateTracking();
  return (
    <Pressable
      testID="support"
      onPress={() => {
        trackClick(OsUpdateButton.LEDGER_SUPPORT);
        openSupport();
      }}
    />
  );
}

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

  it("tells the sheet its content already reserves the bottom safe area", () => {
    render(
      <OsUpdateStateSheet isOpen>
        <Text>sheet content</Text>
      </OsUpdateStateSheet>,
    );

    expect(sheetProps()).toMatchObject({ enableDynamicSizing: true, contentHasBottomSpace: true });
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

  it("gives its content the flow ports and tracking, which the sheet portals out of reach", async () => {
    const trackClick = jest.fn();
    const { ports, user } = render(
      <OsUpdateTrackingContext.Provider
        value={{ trackPage: jest.fn(), trackClick, trackCompleted: jest.fn() }}
      >
        <OsUpdateStateSheet isOpen>
          <SupportButton />
        </OsUpdateStateSheet>
      </OsUpdateTrackingContext.Provider>,
    );

    // gorhom re-renders the sheet content under a host mounted above the app.
    const portaled = renderOutsideProviders(<>{sheetProps()?.children}</>);
    await user.press(portaled.getByTestId("support"));

    expect(ports.openSupport).toHaveBeenCalledTimes(1);
    expect(trackClick).toHaveBeenCalledWith(OsUpdateButton.LEDGER_SUPPORT);
  });
});
