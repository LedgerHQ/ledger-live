import React from "react";
import { render, screen } from "@tests/test-renderer";
import { Text, TileButton, Box } from "@ledgerhq/lumen-ui-rnative";
import { CreditCard, Screens } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ScreenHeroSectionView } from "./ScreenHeroSectionView";

const MockCtasSection = () => (
  <Box lx={{ flexDirection: "row", gap: "s8", width: "full" }}>
    <TileButton
      lx={{ flex: 1 }}
      icon={Screens}
      onPress={jest.fn()}
      testID="cta-explore"
      accessibilityLabel="Explore cards"
      isFull
    >
      Explore cards
    </TileButton>
    <TileButton
      lx={{ flex: 1 }}
      icon={CreditCard}
      onPress={jest.fn()}
      testID="cta-have-card"
      accessibilityLabel="I have a card"
      isFull
    >
      I have a card
    </TileButton>
  </Box>
);

describe("ScreenHeroSectionView", () => {
  it("should render children content", () => {
    render(
      <ScreenHeroSectionView>
        <Text typography="heading1SemiBold">The most secure wallet</Text>
      </ScreenHeroSectionView>,
    );
    expect(screen.getByText("The most secure wallet")).toBeVisible();
  });

  it("should render CTAs when ctas prop is provided", () => {
    render(
      <ScreenHeroSectionView ctas={<MockCtasSection />}>
        <Text typography="heading1SemiBold">Ledger Card</Text>
      </ScreenHeroSectionView>,
    );
    expect(screen.getByText("Explore cards")).toBeVisible();
    expect(screen.getByText("I have a card")).toBeVisible();
  });

  it("should not render CTAs container when ctas prop is omitted", () => {
    render(
      <ScreenHeroSectionView testID="hero">
        <Text typography="heading1SemiBold">The most secure wallet</Text>
      </ScreenHeroSectionView>,
    );
    expect(screen.getByText("The most secure wallet")).toBeVisible();
    expect(screen.queryByTestId("cta-explore")).toBeNull();
  });

  it("should forward testID to root container", () => {
    render(
      <ScreenHeroSectionView testID="hero-section">
        <Text typography="heading1SemiBold">The most secure wallet</Text>
      </ScreenHeroSectionView>,
    );
    expect(screen.getByTestId("hero-section")).toBeVisible();
  });

  it("should render both children and CTAs simultaneously", () => {
    render(
      <ScreenHeroSectionView ctas={<MockCtasSection />} testID="hero-section">
        <Text typography="heading1SemiBold" testID="hero-title">
          Ledger Card
        </Text>
      </ScreenHeroSectionView>,
    );
    expect(screen.getByTestId("hero-section")).toBeVisible();
    expect(screen.getByTestId("hero-title")).toBeVisible();
    expect(screen.getByTestId("cta-explore")).toBeVisible();
    expect(screen.getByTestId("cta-have-card")).toBeVisible();
  });
});
