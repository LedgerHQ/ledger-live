import React from "react";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { PnlCard } from "../components/PnlCard";

const TITLE = "Unrealised return";
const VALUE = "$243.32";

const withPnl = (enabled: boolean) =>
  withFlagOverrides({ lwmWallet40: { enabled: true, params: { pnl: enabled } } });

const withDiscreet =
  (discreetMode: boolean) =>
  (state: State): State => ({
    ...state,
    settings: { ...state.settings, discreetMode },
  });

const compose =
  (...transforms: Array<(state: State) => State>) =>
  (state: State): State =>
    transforms.reduce((acc, t) => t(acc), state);

describe("PnlCard integration", () => {
  describe("feature flag gating", () => {
    it("renders the interactive card when shouldDisplayPnl is true", () => {
      render(
        <PnlCard type="interactive" title={TITLE} value={VALUE} trend="up" onPress={jest.fn()} />,
        { overrideInitialState: withPnl(true) },
      );

      expect(screen.getByText(TITLE)).toBeOnTheScreen();
      expect(screen.getByText(VALUE)).toBeOnTheScreen();
    });

    it("renders nothing when shouldDisplayPnl is false", () => {
      render(
        <PnlCard type="interactive" title={TITLE} value={VALUE} trend="up" onPress={jest.fn()} />,
        { overrideInitialState: withPnl(false) },
      );

      expect(screen.queryByText(TITLE)).toBeNull();
      expect(screen.queryByText(VALUE)).toBeNull();
    });
  });

  describe("interactive variant", () => {
    it("calls onPress when the card is pressed", async () => {
      const onPress = jest.fn();
      const { user } = render(
        <PnlCard
          type="interactive"
          title={TITLE}
          value={VALUE}
          trend="up"
          onPress={onPress}
          testID="pnl-card"
        />,
        { overrideInitialState: withPnl(true) },
      );

      await user.press(screen.getByTestId("pnl-card"));

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("info variant", () => {
    it("renders without onPress and with the info icon", () => {
      render(<PnlCard type="info" title="Cost basis" value="$2.21" />, {
        overrideInitialState: withPnl(true),
      });

      expect(screen.getByText("Cost basis")).toBeOnTheScreen();
      expect(screen.getByText("$2.21")).toBeOnTheScreen();
    });
  });

  describe("discreet mode", () => {
    it("hides the value when discreet mode is on", () => {
      render(
        <PnlCard type="interactive" title={TITLE} value={VALUE} trend="up" onPress={jest.fn()} />,
        { overrideInitialState: compose(withPnl(true), withDiscreet(true)) },
      );

      expect(screen.getByText("***")).toBeOnTheScreen();
      expect(screen.queryByText(VALUE)).toBeNull();
    });

    it("shows the value when discreet mode is off", () => {
      render(
        <PnlCard type="interactive" title={TITLE} value={VALUE} trend="up" onPress={jest.fn()} />,
        { overrideInitialState: compose(withPnl(true), withDiscreet(false)) },
      );

      expect(screen.getByText(VALUE)).toBeOnTheScreen();
      expect(screen.queryByText("***")).toBeNull();
    });
  });
});
