import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { receiveTestWrapper, testOpenExternal } from "../../__tests__/receiveTestStore";
import { RECEIVE_URLS } from "../../urls";
import { NetworkHelpDescription, NetworkHelpPanel } from ".";

describe("NetworkHelp (Native)", () => {
  it("should ask for the sender's network of the asset, and open the help from Learn more", async () => {
    const onLearnMore = jest.fn();
    render(<NetworkHelpDescription assetTicker="USDC" onLearnMore={onLearnMore} />, {
      wrapper: receiveTestWrapper(),
    });

    expect(screen.getByTestId("receive-network-help-description")).toHaveTextContent(
      "Select the same network you're using to send your USDC. Learn more",
    );
    await userEvent.setup().press(screen.getByRole("link", { name: "Learn more" }));
    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });

  it("should explain the network choice, and open its FAQ article", async () => {
    render(<NetworkHelpPanel />, { wrapper: receiveTestWrapper() });

    expect(screen.getByText(/you'll be asked to choose a network/)).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("link", { name: "visit our FAQ page" }));
    expect(testOpenExternal).toHaveBeenCalledWith(RECEIVE_URLS.receiveFromExchange);
  });
});
