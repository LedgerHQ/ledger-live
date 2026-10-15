import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useGetFearAndGreedLatestQuery } from "@domain/api-market-index-fear-and-greed";
import type { FearAndGreedIndex } from "@domain/entity-market-index-fear-and-greed";
import { track } from "@shared/analytics";
import { I18nTestProvider } from "@shared/i18n/testing";
import { FearAndGreed } from "./index";
import { FEAR_AND_GREED_REFRESH_INTERVAL_MS } from "./constants";
import type { GaugeComponent } from "./types";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

jest.mock("@domain/api-market-index-fear-and-greed", () => ({
  useGetFearAndGreedLatestQuery: jest.fn(),
}));

const mockedQuery = jest.mocked(useGetFearAndGreedLatestQuery);
const mockedTrack = jest.mocked(track);

const Gauge: GaugeComponent = ({ value }) => <span>{value}</span>;

const neutral: FearAndGreedIndex = { value: 50, classification: "Neutral" };

function mockQuery({
  data,
  isLoading = false,
  isError = false,
}: {
  data?: FearAndGreedIndex;
  isLoading?: boolean;
  isError?: boolean;
}) {
  mockedQuery.mockReturnValue({
    data,
    isLoading,
    isError,
  } as unknown as ReturnType<typeof useGetFearAndGreedLatestQuery>);
}

function renderFearAndGreed(props: Partial<React.ComponentProps<typeof FearAndGreed>> = {}) {
  return render(
    <I18nTestProvider>
      <FearAndGreed Gauge={Gauge} {...props} />
    </I18nTestProvider>,
  );
}

describe("FearAndGreed web", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should poll the latest index on the refresh interval", () => {
    mockQuery({ data: neutral });

    renderFearAndGreed();

    expect(mockedQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: FEAR_AND_GREED_REFRESH_INTERVAL_MS,
    });
  });

  it("should render the compact card from query data", () => {
    mockQuery({ data: neutral });

    renderFearAndGreed();

    expect(screen.getByTestId("fear-and-greed-card")).toBeVisible();
    expect(screen.getByText("50")).toBeVisible();
  });

  it("should show the compact skeleton while loading", () => {
    mockQuery({ isLoading: true });

    renderFearAndGreed();

    expect(screen.getByTestId("fear-and-greed-skeleton")).toBeVisible();
  });

  it("should track the definition open once until the dialog closes", () => {
    mockQuery({ data: neutral });
    renderFearAndGreed();

    fireEvent.click(screen.getByTestId("fear-and-greed-card"));
    fireEvent.click(screen.getByTestId("fear-and-greed-card"));

    expect(screen.getByTestId("fear-and-greed-dialog-content")).toBeVisible();
    expect(mockedTrack).toHaveBeenCalledTimes(1);
    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      button: "mood_index_definition",
    });

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByTestId("fear-and-greed-dialog-content")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("fear-and-greed-card"));

    expect(mockedTrack).toHaveBeenCalledTimes(2);
  });

  it("should render nothing when the compact query fails", () => {
    mockQuery({ isError: true });

    renderFearAndGreed();

    expect(screen.queryByTestId("fear-and-greed-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("fear-and-greed-skeleton")).not.toBeInTheDocument();
  });

  it("should render the expanded skeleton while loading", () => {
    mockQuery({ isLoading: true });

    renderFearAndGreed({ appearance: "expanded" });

    expect(screen.getByTestId("market-top-card-2")).toBeVisible();
  });

  it("should render the expanded card from query data", () => {
    mockQuery({ data: neutral });

    renderFearAndGreed({ appearance: "expanded" });

    expect(screen.getByTestId("mood-index-card")).toBeVisible();
    expect(screen.getByText("50")).toBeVisible();
  });

  it("should render the expanded error card when the query fails", () => {
    mockQuery({ isError: true });

    renderFearAndGreed({ appearance: "expanded" });

    expect(screen.getByTestId("market-top-card-2")).toBeVisible();
    expect(screen.getByText("market.topCards.error")).toBeVisible();
  });
});
