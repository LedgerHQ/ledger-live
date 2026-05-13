import React from "react";
import { Linking } from "react-native";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { FooterSection } from "../components/Footer/FooterSection";

describe("FooterSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  it("should open the explorer URL when the explorer action is pressed", () => {
    render(<FooterSection explorerUrl="https://explorer.test/tx/1" isLoading={false} />);

    fireEvent.press(screen.getByText("View in explorer"));

    expect(Linking.openURL).toHaveBeenCalledWith("https://explorer.test/tx/1");
  });

  it("should hide the explorer action while loading", () => {
    render(<FooterSection explorerUrl="https://explorer.test/tx/1" isLoading />);

    expect(screen.queryByText("View in explorer")).toBeNull();
  });

  it("should hide the explorer action when no explorer URL is available", () => {
    render(<FooterSection isLoading={false} />);

    expect(screen.queryByText("View in explorer")).toBeNull();
  });
});
