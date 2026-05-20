import React, { useState } from "react";
import { Pressable, Text } from "react-native";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { PnlDetailDrawer } from "LLM/features/Pnl/components/PnlDetailDrawer";
import PnlSection, { PNL_SECTION_TEST_IDS } from "..";

const withPnl = (enabled: boolean) =>
  withFlagOverrides({ lwmWallet40: { enabled: true, params: { pnl: enabled } } });

const OPEN_BUTTON_TEST_ID = "open-drawer-button";

type Variant = "pnl" | "costBasis";

function DrawerOpener({ variant }: { variant: Variant }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable testID={OPEN_BUTTON_TEST_ID} onPress={() => setOpen(true)}>
        <Text>Open</Text>
      </Pressable>
      {open ? (
        variant === "pnl" ? (
          <PnlDetailDrawer
            isOpen
            onClose={() => setOpen(false)}
            title="Total profit and loss"
            description="A summary of how your portfolio has performed."
            items={[
              {
                title: "Unrealised return",
                value: "+ $243.32",
                definition: "The estimated gain or loss if sold at today's price.",
              },
            ]}
          />
        ) : (
          <PnlDetailDrawer
            isOpen
            onClose={() => setOpen(false)}
            title="Cost basis"
            bodyText="The total amount you paid to acquire your current holdings, including fees."
          />
        )
      ) : null}
    </>
  );
}

describe("PnlSection integration", () => {
  describe("feature flag gating", () => {
    it("renders both PnL cards when shouldDisplayPnl is true", () => {
      render(<PnlSection />, { overrideInitialState: withPnl(true) });

      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.root)).toBeVisible();
      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.unrealisedCard)).toBeVisible();
      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.costBasisCard)).toBeVisible();
    });

    it("renders nothing when shouldDisplayPnl is false", () => {
      render(<PnlSection />, { overrideInitialState: withPnl(false) });

      expect(screen.queryByTestId(PNL_SECTION_TEST_IDS.root)).toBeNull();
    });
  });

  describe("drawer opening", () => {
    it("renders the PnL detail drawer when its open button is pressed", async () => {
      const { user } = render(<DrawerOpener variant="pnl" />);

      expect(screen.queryByText("Total profit and loss")).toBeNull();

      await user.press(screen.getByTestId(OPEN_BUTTON_TEST_ID));

      expect(screen.getByText("Total profit and loss")).toBeVisible();
      expect(screen.getByText("A summary of how your portfolio has performed.")).toBeVisible();
      expect(screen.getByText("Unrealised return")).toBeVisible();
    });

    it("renders the cost basis drawer when its open button is pressed", async () => {
      const { user } = render(<DrawerOpener variant="costBasis" />);
      const body = "The total amount you paid to acquire your current holdings, including fees.";

      expect(screen.queryByText(body)).toBeNull();

      await user.press(screen.getByTestId(OPEN_BUTTON_TEST_ID));

      expect(screen.getByText("Cost basis")).toBeVisible();
      expect(screen.getByText(body)).toBeVisible();
    });
  });
});
