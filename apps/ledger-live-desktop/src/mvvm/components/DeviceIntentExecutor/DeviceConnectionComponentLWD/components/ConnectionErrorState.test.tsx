import React from "react";
import {
  BaseConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-desktop";
import { screen } from "@testing-library/react";

import { makeKnownDevice, renderWithUser } from "../testUtils";
import { ConnectionErrorState } from "./ConnectionErrorState";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const { mockT } = jest.requireActual("../testUtils");
      return mockT(key, params);
    },
  }),
}));

type ConnectionErrorUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.ConnectionError }
>;

function renderState(state: Partial<ConnectionErrorUIState> = {}) {
  return renderWithUser(
    <ConnectionErrorState
      state={
        {
          type: ConnectDeviceUIStateTypes.ConnectionError,
          error: { type: BaseConnectionErrorTypes.Unknown },
          device: makeKnownDevice(),
          retry: jest.fn(),
          ignore: jest.fn(),
          ...state,
        } as ConnectionErrorUIState
      }
    />,
  );
}

describe("ConnectionErrorState", () => {
  it("should render the unknown connection error title and CTA", () => {
    renderState();

    expect(screen.getByText("Pairing unsuccessful")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("should render the unknown connection error description and tip", () => {
    renderState();

    expect(
      screen.getByText("Please try again or read our Bluetooth troubleshooting article below."),
    ).toBeVisible();
    expect(screen.getByText("Make sure your device is unlocked.")).toBeVisible();
  });

  it("should call retry when the retry CTA is clicked", async () => {
    const retry = jest.fn();
    const { user } = renderState({ retry });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("should render nothing when a non-desktop connection error is received", () => {
    const { container } = renderState({
      error: { type: "ble-pairing-refused" },
    } as unknown as Partial<ConnectionErrorUIState>);

    expect(container).toBeEmptyDOMElement();
  });
});
