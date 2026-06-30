import React from "react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-desktop";
import { screen } from "@testing-library/react";

import { makeKnownDevice, renderWithUser } from "../testUtils";
import { ConnectingState } from "./ConnectingState";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const { mockT } = jest.requireActual("../testUtils");
      return mockT(key, params);
    },
  }),
}));

type ConnectingUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.Connecting }
>;

describe("ConnectingState", () => {
  it("GIVEN a connecting state WHEN rendering THEN it shows the loading title", () => {
    // GIVEN
    const state: ConnectingUIState = {
      type: ConnectDeviceUIStateTypes.Connecting,
      device: makeKnownDevice(),
    };

    // WHEN
    renderWithUser(<ConnectingState state={state} />);

    // THEN
    expect(screen.getByText("Loading")).toBeVisible();
  });
});
