import React from "react";
import { render, screen } from "@tests/test-renderer";
import { TrackScreen, track } from "~/analytics";
import { SourceFlowProvider } from "../utils/SourceFlowContext";
import { PAGE_DEVICE_ACTION } from "../utils/trackDeviceIntent";
import { InvalidOperation } from "./InvalidOperation";

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

function renderState(props: Partial<React.ComponentProps<typeof InvalidOperation>> = {}) {
  return render(
    <SourceFlowProvider value="my_ledger">
      <InvalidOperation onClose={jest.fn()} error={null} {...props} />
    </SourceFlowProvider>,
  );
}

describe("InvalidOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, description and the primary Close CTA", () => {
    renderState();

    expect(screen.getByTestId("device-intent-executor-invalid-operation")).toBeVisible();
    expect(screen.getByText("Invalid state")).toBeVisible();
    expect(
      screen.getByText(
        "An error occurred. Please try again or contact Ledger support if the issue persists.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Close")).toBeVisible();
  });

  it("invokes onClose when the primary CTA is pressed", async () => {
    const onClose = jest.fn();

    const { user } = renderState({ onClose });

    await user.press(screen.getByText("Close"));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      sourceFlow: "my_ledger",
      deviceUxV2: true,
      button: "Close",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fires the Device Action - Invalid State page event with sourceFlow and deviceUxV2", () => {
    renderState();

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_DEVICE_ACTION.InvalidState,
        sourceFlow: "my_ledger",
        deviceUxV2: true,
      }),
      undefined,
    );
  });
});
