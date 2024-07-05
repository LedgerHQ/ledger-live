/* eslint-disable i18next/no-literal-string */
import * as React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { Web3HubTest } from "./shared";

describe("Web3Hub integration test", () => {
  it("Should list manifests and navigate to app page", async () => {
    const { user } = render(<Web3HubTest />);

    // Header stuff cannot be tested with the native-stack for now
    // but we can mock and use the js stack instead if needed
    // expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();
    await user.press(screen.getByText("Dummy Wallet App"));
    expect(await screen.findByText("Web3HubApp")).toBeOnTheScreen();
    expect(await screen.findByText("dummy")).toBeOnTheScreen();

    // Header stuff cannot be tested with the native-stack
    // await user.press(screen.getByText("Explore web3"));
    // expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    // The second user press is not working too
    // expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();
    // await user.press(screen.getByText("Wallet API Tools"));
    // expect(await screen.findByText("Web3HubApp")).toBeOnTheScreen();
    // expect(await screen.findByText("wallet-api-tools")).toBeOnTheScreen();

    // Header stuff cannot be tested with the native-stack
    // await user.press(screen.getByText("Explore web3"));
    // expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
  });
});
