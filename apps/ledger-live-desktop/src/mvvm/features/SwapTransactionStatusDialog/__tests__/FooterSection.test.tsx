import React from "react";
import { render, screen } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { FooterSection } from "../components/Footer/FooterSection";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const mockedOpenURL = jest.mocked(openURL);

describe("FooterSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open the explorer URL when the explorer action is clicked", async () => {
    const { user } = render(
      <FooterSection explorerUrl="https://explorer.test/tx/1" isLoading={false} />,
    );

    await user.click(screen.getByRole("button", { name: "View in explorer" }));

    expect(mockedOpenURL).toHaveBeenCalledWith(
      "https://explorer.test/tx/1",
      "SwapTransactionStatus_ViewExplorer",
    );
  });

  it("should hide the explorer action while loading", () => {
    render(<FooterSection explorerUrl="https://explorer.test/tx/1" isLoading />);

    expect(screen.queryByRole("button", { name: "View in explorer" })).not.toBeInTheDocument();
  });

  it("should hide the explorer action when no explorer URL is available", () => {
    render(<FooterSection isLoading={false} />);

    expect(screen.queryByRole("button", { name: "View in explorer" })).not.toBeInTheDocument();
  });
});
