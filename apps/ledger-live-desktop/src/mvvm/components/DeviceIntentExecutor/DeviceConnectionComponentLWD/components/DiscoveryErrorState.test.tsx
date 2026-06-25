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
  it("should render the unknown discovery error title and description", () => {
    renderState();

    expect(screen.getByText("Something went wrong")).toBeVisible();
    expect(
      screen.getByText(
        "We couldn’t start the Bluetooth scan. Please try again or contact Ledger support.",
      ),
    ).toBeVisible();
  });

  it("should call retry when the retry CTA is clicked", async () => {
    const retry = jest.fn();
    const { user } = renderState({ retry });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("should not render the retry CTA when retry is unavailable", () => {
    renderState({ retry: undefined });

    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("should render nothing when a non-desktop discovery error is received", () => {
    const { container } = renderState({
      error: { type: "bluetooth-disabled-promptable" },
    } as unknown as Partial<DiscoveryErrorUIState>);

    expect(container).toBeEmptyDOMElement();
  });
});
