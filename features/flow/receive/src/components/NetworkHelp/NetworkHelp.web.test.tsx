import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { receiveTestWrapper, testOpenExternal } from "../../__tests__/receiveTestStore";
import { RECEIVE_URLS } from "../../urls";
import { NetworkHelpDescription, NetworkHelpPanel } from ".";

describe("NetworkHelp (Web)", () => {
  it("should ask for the sender's network of the asset, and open the help from Learn more", async () => {
    const onLearnMore = jest.fn();
    render(<NetworkHelpDescription assetTicker="USDC" onLearnMore={onLearnMore} />, {
      wrapper: receiveTestWrapper(),
    });

    expect(screen.getByTestId("receive-network-help-description")).toHaveTextContent(
      "Select the same network you're using to send your USDC. Learn more",
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "Learn more" }));
    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });

  it("should explain the network choice, and open its FAQ article", async () => {
    render(<NetworkHelpPanel />, { wrapper: receiveTestWrapper() });

    expect(screen.getByText(/you'll be asked to choose a network/)).toBeVisible();
    expect(screen.getByText(/sending a small test amount first/)).toBeVisible();
    await userEvent.setup().click(screen.getByRole("button", { name: "visit our FAQ page" }));
    expect(testOpenExternal).toHaveBeenCalledWith(RECEIVE_URLS.receiveFromExchange);
  });
});
