import React from "react";
import { render, screen } from "tests/testSetup";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import NightlyLayer from "../../index";
import { shouldShowNightlyLayer } from "../../utils/shouldShowNightlyLayer";
import { HideNightlyLayerRow } from "../index";

jest.mock("../../utils/shouldShowNightlyLayer");

const mockShouldShowNightlyLayer = jest.mocked(shouldShowNightlyLayer);

const renderDeveloperRowWithOverlay = (hideNightlyLayer: boolean) =>
  render(
    <>
      <HideNightlyLayerRow />
      <NightlyLayer />
    </>,
    { initialState: { settings: { ...SETTINGS_INITIAL_STATE, hideNightlyLayer } } },
  );

const theSwitch = () => screen.getByTestId("settings-hide-nightly-layer");

describe("HideNightlyLayerRow", () => {
  beforeEach(() => {
    mockShouldShowNightlyLayer.mockReturnValue(true);
  });

  it("is not rendered outside nightly builds", () => {
    mockShouldShowNightlyLayer.mockReturnValue(false);

    renderDeveloperRowWithOverlay(false);

    expect(screen.queryByTestId("settings-hide-nightly-layer")).not.toBeInTheDocument();
    expect(screen.queryByText("Hide pre-release overlay")).not.toBeInTheDocument();
  });

  it("hides the pre-release overlay when turned on", async () => {
    const { user, store } = renderDeveloperRowWithOverlay(false);
    expect(screen.getByText("Hide pre-release overlay")).toBeInTheDocument();
    expect(theSwitch()).not.toBeChecked();
    expect(screen.getByTestId("nightly-layer")).toBeInTheDocument();

    await user.click(theSwitch());

    expect(theSwitch()).toBeChecked();
    expect(store.getState().settings.hideNightlyLayer).toBe(true);
    expect(screen.queryByTestId("nightly-layer")).not.toBeInTheDocument();
  });

  it("shows the pre-release overlay again when turned off", async () => {
    const { user, store } = renderDeveloperRowWithOverlay(true);
    expect(theSwitch()).toBeChecked();
    expect(screen.queryByTestId("nightly-layer")).not.toBeInTheDocument();

    await user.click(theSwitch());

    expect(theSwitch()).not.toBeChecked();
    expect(store.getState().settings.hideNightlyLayer).toBe(false);
    expect(screen.getByTestId("nightly-layer")).toBeInTheDocument();
  });
});
