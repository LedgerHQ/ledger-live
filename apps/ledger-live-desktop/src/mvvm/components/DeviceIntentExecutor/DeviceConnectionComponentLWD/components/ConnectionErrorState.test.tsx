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
  it("GIVEN an unknown connection error WHEN rendering THEN it shows the title and retry CTA", () => {
    // WHEN
    renderState();

    // THEN
    expect(screen.getByText("Pairing unsuccessful")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("GIVEN an unknown connection error WHEN rendering THEN it shows the description and tip", () => {
    // WHEN
    renderState();

    // THEN
    expect(screen.getByText("Please try again.")).toBeVisible();
    expect(screen.getByText("Make sure your device is unlocked.")).toBeVisible();
  });

  it("GIVEN an unknown connection error WHEN clicking the retry CTA THEN it calls retry", async () => {
    // GIVEN
    const retry = jest.fn();
    const { user } = renderState({ retry });

    // WHEN
    await user.click(screen.getByRole("button", { name: "Try again" }));

    // THEN
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("GIVEN a non-desktop connection error WHEN rendering THEN it renders nothing", () => {
    // WHEN
    const { container } = renderState({
      error: { type: "ble-pairing-refused" },
    } as unknown as Partial<ConnectionErrorUIState>);

    // THEN
    expect(container).toBeEmptyDOMElement();
  });
});
