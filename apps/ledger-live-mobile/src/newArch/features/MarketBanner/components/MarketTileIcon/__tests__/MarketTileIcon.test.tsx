import React from "react";
import { render, fireEvent } from "@tests/test-renderer";
import MarketTileIcon from "../index";

const MOCK_IMAGE_URL = "https://example.com/bitcoin.png";

describe("MarketTileIcon", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders an image with correct source when imageUrl is provided", () => {
    const { getByTestId } = render(<MarketTileIcon imageUrl={MOCK_IMAGE_URL} name="Bitcoin" />);

    const image = getByTestId("market-tile-icon-image");
    expect(image.props.source).toEqual({ uri: MOCK_IMAGE_URL });
  });

  it("renders fallback letter when no imageUrl is provided", () => {
    const { getByText, getByTestId } = render(<MarketTileIcon imageUrl={null} name="Bitcoin" />);

    expect(getByTestId("market-tile-icon-fallback")).toBeTruthy();
    expect(getByText("B")).toBeTruthy();
  });

  it("renders fallback letter when imageUrl is undefined", () => {
    const { getByText, getByTestId } = render(<MarketTileIcon name="Ethereum" />);

    expect(getByTestId("market-tile-icon-fallback")).toBeTruthy();
    expect(getByText("E")).toBeTruthy();
  });

  it("renders uppercase first letter as fallback", () => {
    const { getByText } = render(<MarketTileIcon name="solana" />);

    expect(getByText("S")).toBeTruthy();
  });

  it("renders fallback letter when image fails to load", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <MarketTileIcon imageUrl="https://invalid-url.com/image.png" name="Cardano" />,
    );

    // Initially, the image should be rendered
    const image = getByTestId("market-tile-icon-image");
    expect(image).toBeTruthy();

    // Fallback should not be visible initially
    expect(queryByTestId("market-tile-icon-fallback")).toBeNull();

    // Simulate image error
    fireEvent(image, "error");

    // After error, fallback should be visible
    expect(getByTestId("market-tile-icon-fallback")).toBeTruthy();
    expect(getByText("C")).toBeTruthy();
  });
});
