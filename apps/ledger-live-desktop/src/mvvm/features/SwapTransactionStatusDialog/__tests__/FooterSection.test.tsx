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
      {},
      { sensitive: true },
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

  it("should call the return action when it is clicked", async () => {
    const onClick = jest.fn();
    const { user } = render(
      <FooterSection
        explorerUrl="https://explorer.test/tx/1"
        isLoading={false}
        returnAction={{ label: "Return to Perps", onClick }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Return to Perps" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "View in explorer" })).toBeVisible();
  });

  it("should keep the return action while the explorer action is loading", () => {
    render(
      <FooterSection isLoading returnAction={{ label: "Return to Perps", onClick: jest.fn() }} />,
    );

    expect(screen.getByRole("button", { name: "Return to Perps" })).toBeVisible();
  });
});
