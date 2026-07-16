import React from "react";
import { log } from "@ledgerhq/logs";
import { Linking } from "react-native";
import { render, screen, waitFor } from "@tests/test-renderer";
import { FooterSection } from "../components/Footer/FooterSection";

jest.mock("@ledgerhq/logs", () => ({
  ...jest.requireActual("@ledgerhq/logs"),
  log: jest.fn(),
}));

describe("FooterSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  it("should open the explorer URL when the explorer action is pressed", async () => {
    const { user } = render(
      <FooterSection explorerUrl="https://explorer.test/tx/1" isLoading={false} />,
    );

    await user.press(screen.getByText("View in explorer"));

    expect(Linking.openURL).toHaveBeenCalledWith("https://explorer.test/tx/1");
  });

  it("should log when opening the explorer URL fails", async () => {
    const error = new Error("Cannot open URL");
    jest.spyOn(Linking, "openURL").mockRejectedValue(error);

    const { user } = render(
      <FooterSection explorerUrl="https://explorer.test/tx/1" isLoading={false} />,
    );

    await user.press(screen.getByText("View in explorer"));

    await waitFor(() => {
      expect(log).toHaveBeenCalledWith("swap-transaction-status", "Failed to open explorer URL", {
        error,
        url: "https://explorer.test/tx/1",
      });
    });
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
