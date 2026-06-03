import React from "react";
import { render, screen } from "@tests/test-renderer";
import { TrackScreen, track } from "~/analytics";
import { previousRouteNameRef } from "~/analytics/screenRefs";
import { SourceFlowProvider } from "../../utils/SourceFlowContext";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";
import { NoKnownDeviceState } from "./NoKnownDeviceState";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
    track: jest.fn(),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);
const mockedTrack = jest.mocked(track);
const TEST_SOURCE = "Portfolio";

function renderState() {
  const onConnectLedgerDevice = jest.fn();
  const onBuyLedgerDevice = jest.fn();
  const view = render(
    <SourceFlowProvider value="my_ledger">
      <NoKnownDeviceState
        onConnectLedgerDevice={onConnectLedgerDevice}
        onBuyLedgerDevice={onBuyLedgerDevice}
      />
    </SourceFlowProvider>,
  );

  return { ...view, onConnectLedgerDevice, onBuyLedgerDevice };
}

describe("NoKnownDeviceState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    previousRouteNameRef.current = TEST_SOURCE;
  });

  it("should render the no known device title and description", () => {
    renderState();

    expect(screen.getByText("Ledger device required")).toBeVisible();
    expect(screen.getByText("To continue, set up or connect your signer.")).toBeVisible();
  });

  it("should call the action callbacks when buttons are pressed", async () => {
    const { user, onConnectLedgerDevice, onBuyLedgerDevice } = renderState();

    await user.press(screen.getByText("Connect Ledger device"));
    await user.press(screen.getByText("I don't have a Ledger device"));

    expect(onConnectLedgerDevice).toHaveBeenCalledTimes(1);
    expect(onBuyLedgerDevice).toHaveBeenCalledTimes(1);
  });

  it("GIVEN no known device WHEN rendering THEN it tracks the Device UX V2 page event", () => {
    // GIVEN / WHEN
    renderState();

    // THEN
    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_CONNECT_DEVICE.NoKnownDevice,
        sourceFlow: "my_ledger",
        deviceUxV2: true,
      }),
      undefined,
    );
  });

  it("GIVEN no known device WHEN buttons are pressed THEN it tracks button clicks", async () => {
    // GIVEN
    const { user } = renderState();

    // WHEN
    await user.press(screen.getByText("Connect Ledger device"));
    await user.press(screen.getByText("I don't have a Ledger device"));

    // THEN
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      source: TEST_SOURCE,
      deviceUxV2: true,
      button: "Connect Ledger Device",
    });
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      source: TEST_SOURCE,
      deviceUxV2: true,
      button: "I Don't Have A Ledger Device",
    });
  });
});
