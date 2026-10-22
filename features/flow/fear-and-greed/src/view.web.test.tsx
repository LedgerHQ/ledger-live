import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nTestProvider } from "@shared/i18n/testing";
import type { FearAndGreedIndex } from "@domain/entity-market-index-fear-and-greed";
import { FearAndGreedView } from "./view.web";
import type { FearAndGreedAppearance, GaugeComponent } from "./types";

const Gauge: GaugeComponent = ({ value }) => <span>{value}</span>;

const neutral: FearAndGreedIndex = { value: 50, classification: "Neutral" };

function renderView({
  isLoading,
  isError = false,
  data,
  appearance,
}: {
  isLoading: boolean;
  isError?: boolean;
  data: FearAndGreedIndex | undefined;
  appearance?: FearAndGreedAppearance;
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
        />
      </I18nTestProvider>
    );
  }

  return render(<Harness />);
}

describe("FearAndGreedView", () => {
  it("renders the card when data is ready", () => {
    renderView({ isLoading: false, data: neutral });
    expect(screen.getByTestId("fear-and-greed-card")).toBeVisible();
  });

  it("renders the loading skeleton", () => {
    renderView({ isLoading: true, data: undefined });
    expect(screen.getByTestId("fear-and-greed-skeleton")).toBeVisible();
  });

  it("renders nothing when there is no data and loading is finished", () => {
    const { container } = renderView({ isLoading: false, data: undefined });
    expect(container.firstChild).toBeNull();
  });

  describe("expanded appearance", () => {
    it("renders the expanded card when data is ready", () => {
      renderView({ isLoading: false, data: neutral, appearance: "expanded" });
      expect(screen.getByTestId("mood-index-card")).toBeVisible();
    });

    it("renders the expanded loading skeleton", () => {
      renderView({ isLoading: true, data: undefined, appearance: "expanded" });
      expect(screen.getByTestId("market-top-card-2")).toBeVisible();
    });

    it("renders the expanded error card", () => {
      renderView({
        isLoading: false,
        isError: true,
        data: undefined,
        appearance: "expanded",
      });
      expect(screen.getByTestId("market-top-card-2")).toBeVisible();
      expect(screen.getByText("market.topCards.error")).toBeVisible();
    });
  });

  describe("definition dialog", () => {
    it("opens the dialog when the card is clicked", () => {
      renderView({ isLoading: false, data: neutral });

      fireEvent.click(screen.getByTestId("fear-and-greed-card"));

      expect(screen.getByTestId("fear-and-greed-dialog-content")).toBeVisible();
    });

    it("closes the dialog from the close button", () => {
      renderView({ isLoading: false, data: neutral });

      fireEvent.click(screen.getByTestId("fear-and-greed-card"));
      fireEvent.click(screen.getByRole("button", { name: /close/i }));

      expect(screen.queryByTestId("fear-and-greed-dialog-content")).not.toBeInTheDocument();
    });

    it("closes the dialog from the confirmation button", () => {
      renderView({ isLoading: false, data: neutral });

      fireEvent.click(screen.getByTestId("fear-and-greed-card"));
      fireEvent.click(screen.getByTestId("fear-and-greed-dialog-cta"));

      expect(screen.queryByTestId("fear-and-greed-dialog-content")).not.toBeInTheDocument();
    });
  });
});
