import React from "react";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { PnlCard } from "../components/PnlCard";

const TITLE = "Unrealised return";
const VALUE = "$243.32";

const withPnl = (enabled: boolean) =>
  withFlagOverrides({ lwmWallet40: { enabled: true, params: { pnl: enabled } } });

describe("PnlCard integration", () => {
  describe("feature flag gating", () => {
    it("renders the interactive card when shouldDisplayPnl is true", () => {
      render(
        <PnlCard type="interactive" title={TITLE} value={VALUE} trend="up" onPress={jest.fn()} />,
        { overrideInitialState: withPnl(true) },
      );

      expect(screen.getByText(TITLE)).toBeVisible();
      expect(screen.getByText(VALUE)).toBeVisible();
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

    it("keeps long titles on one line", () => {
      const longTitle = "Unrealised return across the full portfolio";

      render(
        <PnlCard
          type="interactive"
          title={longTitle}
          value={VALUE}
          trend="up"
          onPress={jest.fn()}
        />,
        { overrideInitialState: withPnl(true) },
      );

      expect(screen.getByText(longTitle).props).toMatchObject({
        numberOfLines: 1,
        ellipsizeMode: "tail",
      });
    });
  });

  describe("info variant", () => {
    it("renders without onPress and with the info icon", () => {
      render(<PnlCard type="info" title="Cost basis" value="$2.21" />, {
        overrideInitialState: withPnl(true),
      });

      expect(screen.getByText("Cost basis")).toBeVisible();
      expect(screen.getByText("$2.21")).toBeVisible();
    });
  });
});
