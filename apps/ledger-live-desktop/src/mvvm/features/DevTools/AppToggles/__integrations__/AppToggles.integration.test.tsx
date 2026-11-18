import React from "react";
import { render, screen } from "tests/testSetup";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import NightlyLayer from "LLD/components/NightlyLayer";
import { shouldShowNightlyLayer } from "LLD/components/NightlyLayer/utils/shouldShowNightlyLayer";
import { useAppTogglesTool } from "../useAppTogglesTool";

jest.mock("LLD/components/NightlyLayer/utils/shouldShowNightlyLayer");

const mockShouldShowNightlyLayer = jest.mocked(shouldShowNightlyLayer);

/** Stands in for the devtool, which only calls the toggle it receives. */
function HideNightlyLayerToggle() {
  const [toggle] = useAppTogglesTool().toggles;

  return (
    <>
      <span>{toggle.lockedReason}</span>
      <button
        type="button"
        disabled={toggle.lockedReason !== null}
        onClick={() => toggle.onChange(!toggle.isOn)}
      >
        {toggle.isOn ? "On" : "Off"}
      </button>
    </>
  );
}

const renderToggleWithOverlay = (hideNightlyLayer: boolean) =>
  render(
    <>
      <HideNightlyLayerToggle />
      <NightlyLayer />
    </>,
    { initialState: { settings: { ...SETTINGS_INITIAL_STATE, hideNightlyLayer } } },
  );

describe("AppToggles — hide pre-release overlay", () => {
  beforeEach(() => {
    mockShouldShowNightlyLayer.mockReturnValue(true);
  });

  it("hides the pre-release overlay when turned on", async () => {
    const { user, store } = renderToggleWithOverlay(false);
    expect(screen.getByTestId("nightly-layer")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Off" }));

    expect(store.getState().settings.hideNightlyLayer).toBe(true);
    expect(screen.getByRole("button", { name: "On" })).toBeInTheDocument();
    expect(screen.queryByTestId("nightly-layer")).not.toBeInTheDocument();
  });

  it("shows the pre-release overlay again when turned off", async () => {
    const { user, store } = renderToggleWithOverlay(true);
    expect(screen.queryByTestId("nightly-layer")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "On" }));

    expect(store.getState().settings.hideNightlyLayer).toBe(false);
    expect(screen.getByTestId("nightly-layer")).toBeInTheDocument();
  });

  it("locks the toggle outside nightly builds", () => {
    mockShouldShowNightlyLayer.mockReturnValue(false);

    renderToggleWithOverlay(false);

    expect(screen.getByText("The overlay only shows on nightly builds.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Off" })).toBeDisabled();
  });
});
