import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  ConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { ConnectionErrorState } from "./ConnectionErrorState";

type ConnectionErrorUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.ConnectionError }
>;

const errorCases = [
  {
    type: ConnectionErrorTypes.BlePairingRefused,
    title: "Pairing was refused",
    description: "Pairing was refused",
  },
  {
    type: ConnectionErrorTypes.BlePairingPeerRemovedPairing,
    title: "Pairing was removed",
    description: "Pairing was removed",
  },
  {
    type: ConnectionErrorTypes.Unknown,
    title: "Unable to connect",
    description: "Unknown error",
  },
] as const;

function renderState(errorType: ConnectionErrorTypes) {
  const retry = jest.fn();
  const ignore = jest.fn();
  const state: ConnectionErrorUIState = {
    type: ConnectDeviceUIStateTypes.ConnectionError,
    error: { type: errorType },
    retry,
    ignore,
  };

  const view = render(<ConnectionErrorState state={state} />);

  return { ...view, retry, ignore };
}

describe("ConnectionErrorState", () => {
  it.each(errorCases)(
    "should render the $type error title and description",
    ({ type, title, description }) => {
      renderState(type);

      if (title === description) {
        expect(screen.getAllByText(title)).toHaveLength(2);
      } else {
        expect(screen.getByText(title)).toBeVisible();
        expect(screen.getByText(description)).toBeVisible();
      }
    },
  );

  it("should call retry and ignore when action buttons are pressed", async () => {
    const { user, retry, ignore } = renderState(ConnectionErrorTypes.Unknown);

    await user.press(screen.getByText("Try again"));
    await user.press(screen.getByText("Close"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(ignore).toHaveBeenCalledTimes(1);
  });
});
