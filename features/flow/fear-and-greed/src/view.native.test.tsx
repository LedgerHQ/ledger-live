import React, { useState } from "react";
import { Text } from "react-native";
import { fireEvent, render, screen, userEvent, within } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import type { FearAndGreedIndex } from "@domain/entity-market-index-fear-and-greed";
import { FearAndGreedView } from "./view";
import type { FearAndGreedAppearance, GaugeComponent } from "./types";

const Gauge: GaugeComponent = ({ value, startColor, endColor }) => (
  <Text>{`${value}:${startColor}:${endColor}`}</Text>
);

const neutral: FearAndGreedIndex = { value: 50, classification: "Neutral" };

const EXPANDED_WIDTH = 276;

type PressedStyle = (state: { pressed: boolean }) => {
  width?: number;
  height: number;
  backgroundColor: string;
};

function renderView({
  isLoading,
  isError = false,
  data,
  appearance,
  width,
}: {
  isLoading: boolean;
  isError?: boolean;
  data: FearAndGreedIndex | undefined;
  appearance?: FearAndGreedAppearance;
  width?: number;
}) {
  function Harness() {
    const [isDefinitionOpen, setIsDefinitionOpen] = useState(false);

    return (
      <I18nTestProvider>
        <FearAndGreedView
          isLoading={isLoading}
          data={data}
          isError={isError}
          isDefinitionOpen={isDefinitionOpen}
          onOpenDefinition={() => setIsDefinitionOpen(true)}
          onCloseDefinition={() => setIsDefinitionOpen(false)}
          Gauge={Gauge}
          appearance={appearance}
          width={width}
        />
      </I18nTestProvider>
    );
  }

  return render(<Harness />);
}

describe("FearAndGreedView native", () => {
  it("should render the compact card when data is ready", () => {
    renderView({ isLoading: false, data: neutral });

    expect(screen.getByTestId("fear-and-greed-card")).toBeVisible();
    expect(screen.getByText("fearAndGreed.tileTitle")).toBeVisible();
    expect(screen.getByText("fearAndGreed.levels.neutral")).toBeVisible();
    expect(screen.getByText("50:#F87274:#6EC85C")).toBeVisible();
  });

  it("should render nothing when compact data is missing", () => {
    renderView({ isLoading: false, data: undefined });

    expect(screen.queryByTestId("fear-and-greed-card")).toBeNull();
    expect(screen.queryByTestId("fear-and-greed-card-error")).toBeNull();
  });

  it("should render nothing when the compact query fails", () => {
    renderView({ isLoading: false, isError: true, data: neutral });

    expect(screen.queryByTestId("fear-and-greed-card")).toBeNull();
  });

  it("should open and close the definition sheet from the compact card", async () => {
    const user = userEvent.setup();
    renderView({ isLoading: false, data: neutral });

    expect(screen.queryByTestId("queued-bottom-sheet-dismiss")).toBeNull();
    expect(screen.getByText("fearAndGreed.description")).toBeVisible();

    await user.press(screen.getByTestId("fear-and-greed-card"));

    expect(screen.getByTestId("queued-bottom-sheet-dismiss")).toBeVisible();
    expect(screen.getByText("fearAndGreed.disclaimer")).toBeVisible();

    fireEvent.press(screen.getByTestId("queued-bottom-sheet-dismiss"));

    expect(screen.queryByTestId("queued-bottom-sheet-dismiss")).toBeNull();
  });

  it("should render the expanded card when data is ready", () => {
    renderView({
      isLoading: false,
      data: neutral,
      appearance: "expanded",
      width: EXPANDED_WIDTH,
    });

    const card = screen.getByTestId("fear-and-greed-card");
    expect(card).toBeVisible();
    expect(within(card).getByText("fearAndGreed.title")).toBeVisible();
    expect(within(card).getByText("fearAndGreed.levels.neutral")).toBeVisible();

    const style = card.props.style as PressedStyle;
    expect(style({ pressed: false })).toEqual(
      expect.objectContaining({
        width: EXPANDED_WIDTH,
        height: 68,
        backgroundColor: "#f5f5f5",
      }),
    );
    expect(style({ pressed: true }).backgroundColor).toBe("#e0e0e0");
  });

  it("should open the definition sheet from the expanded card", async () => {
    const user = userEvent.setup();
    renderView({ isLoading: false, data: neutral, appearance: "expanded", width: EXPANDED_WIDTH });

    await user.press(screen.getByTestId("fear-and-greed-card"));

    expect(screen.getByTestId("queued-bottom-sheet-dismiss")).toBeVisible();
  });

  it("should render the expanded skeleton while loading", () => {
    renderView({ isLoading: true, data: undefined, appearance: "expanded", width: EXPANDED_WIDTH });

    expect(screen.getByTestId("fear-and-greed-card-skeleton")).toBeVisible();
    expect(screen.queryByTestId("fear-and-greed-card")).toBeNull();
  });

  it("should render the expanded error card when the query fails", () => {
    renderView({
      isLoading: false,
      isError: true,
      data: undefined,
      appearance: "expanded",
      width: EXPANDED_WIDTH,
    });

    expect(screen.getByTestId("fear-and-greed-card-error")).toBeVisible();
    expect(screen.getByTestId("fear-and-greed-card-error-icon")).toBeVisible();
    expect(screen.getByText("fearAndGreed.title")).toBeVisible();
    expect(screen.getByText("marketBanner.connectionFailed")).toBeVisible();
  });

  it("should render the expanded error card when data is missing", () => {
    renderView({ isLoading: false, data: undefined, appearance: "expanded" });

    expect(screen.getByTestId("fear-and-greed-card-error")).toBeVisible();
  });
});
