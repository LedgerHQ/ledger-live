import React from "react";
import {
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-desktop";
import { screen } from "@testing-library/react";

import { renderWithUser } from "../testUtils";
import { DiscoveryErrorState } from "./DiscoveryErrorState";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const { mockT } = jest.requireActual("../testUtils");
      return mockT(key, params);
    },
  }),
}));

type DiscoveryErrorUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.DiscoveryError }
>;

function renderState(state: Partial<DiscoveryErrorUIState> = {}) {
  return renderWithUser(
    <DiscoveryErrorState
      state={
        {
          type: ConnectDeviceUIStateTypes.DiscoveryError,
          error: { type: BaseDiscoveryErrorTypes.Unknown },
          retry: jest.fn(),
          ignore: jest.fn(),
          ...state,
        } as DiscoveryErrorUIState
      }
    />,
  );
}

describe("DiscoveryErrorState", () => {
  it("GIVEN an unknown discovery error WHEN rendering THEN it shows the title and description", () => {
    // WHEN
    renderState();

    // THEN
    expect(screen.getByText("Something went wrong")).toBeVisible();
    expect(screen.getByText("Please try again or contact Ledger support.")).toBeVisible();
  });

  it("GIVEN an unknown discovery error with retry WHEN clicking the retry CTA THEN it calls retry", async () => {
    // GIVEN
    const retry = jest.fn();
    const { user } = renderState({ retry });

    // WHEN
    await user.click(screen.getByRole("button", { name: "Try again" }));

    // THEN
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("GIVEN an unknown discovery error without retry WHEN rendering THEN it hides the retry CTA", () => {
    // WHEN
    renderState({ retry: undefined });

    // THEN
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("GIVEN a non-desktop discovery error WHEN rendering THEN it renders nothing", () => {
    // WHEN
    const { container } = renderState({
      error: { type: "bluetooth-disabled-promptable" },
    } as unknown as Partial<DiscoveryErrorUIState>);

    // THEN
    expect(container).toBeEmptyDOMElement();
  });
});
