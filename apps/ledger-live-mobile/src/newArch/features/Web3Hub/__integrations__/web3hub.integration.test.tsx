import * as React from "react";
import { screen, waitForElementToBeRemoved } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { Web3HubTest } from "./shared";
import { Text } from "@ledgerhq/native-ui";

// Need to fix some stuff if we want to test the player too
jest.mock(
  "LLM/features/Web3Hub/screens/Web3HubApp/components/Web3Player",
  () =>
    ({ manifest }: { manifest: AppManifest }) => (
      <>
        <Text>{manifest.id}</Text>
        <Text>{manifest.name}</Text>
      </>
    ),
);

describe("Web3Hub integration test", () => {
  it("Should list manifests and navigate to app page", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect(await screen.findByTestId("web3hub-loading-indicator")).toBeOnTheScreen();
    await waitForElementToBeRemoved(() => screen.getByTestId("web3hub-loading-indicator"), {
      timeout: 1500, // timeout because we mock the return and fake 1s delay
    });

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    await user.press(screen.getByTestId("navigation-header-back-button"));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Wallet API Tools")[0]);
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    await user.press(screen.getByTestId("navigation-header-back-button"));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
  });

  it("Should list manifests, go to search and navigate to app page", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect(await screen.findByTestId("web3hub-loading-indicator")).toBeOnTheScreen();
    await waitForElementToBeRemoved(() => screen.getByTestId("web3hub-loading-indicator"), {
      timeout: 1500, // timeout because we mock the request and fake 1s delay
    });

    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeDisabled();
    await user.press(screen.getByRole("searchbox"));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    await user.press(screen.getByTestId("navigation-header-back-button"));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Wallet API Tools")[0]);
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    await user.press(screen.getByTestId("navigation-header-back-button"));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    await user.press(screen.getByTestId("navigation-header-back-button"));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeDisabled();
  });

  it("Should list manifests, select a category and navigate to app page", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect(await screen.findByTestId("web3hub-loading-indicator")).toBeOnTheScreen();
    await waitForElementToBeRemoved(() => screen.getByTestId("web3hub-loading-indicator"), {
      timeout: 1500, // timeout because we mock the request and fake 1s delay
    });

    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();

    expect(await screen.findByText("games")).toBeOnTheScreen();
    await user.press(screen.getByText("games"));

    expect(await screen.findByTestId("web3hub-loading-indicator")).toBeOnTheScreen();
    await waitForElementToBeRemoved(() => screen.getByTestId("web3hub-loading-indicator"), {
      timeout: 1500, // timeout because we mock the request and fake 1s delay
    });

    expect(screen.queryByText("Wallet API Tools")).not.toBeOnTheScreen();
    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    await user.press(screen.getByTestId("navigation-header-back-button"));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    // scroll to reveal the end of the list
    await user.scrollTo(screen.getByTestId("web3hub-categories-scroll"), { x: 500 });
    expect(await screen.findByText("other")).toBeOnTheScreen();
    await user.press(screen.getByText("other"));

    expect(await screen.findByTestId("web3hub-loading-indicator")).toBeOnTheScreen();
    await waitForElementToBeRemoved(() => screen.getByTestId("web3hub-loading-indicator"), {
      timeout: 1500, // timeout because we mock the request and fake 1s delay
    });

    expect(screen.queryByText("Dummy Wallet App")).not.toBeOnTheScreen();
    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Wallet API Tools")[0]);
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    await user.press(screen.getByTestId("navigation-header-back-button"));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
  });

  it("Should list manifests, go to search and search an app and go it app page", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect(await screen.findByTestId("web3hub-loading-indicator")).toBeOnTheScreen();
    await waitForElementToBeRemoved(() => screen.getByTestId("web3hub-loading-indicator"), {
      timeout: 1500, // timeout because we mock the request and fake 1s delay
    });

    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeDisabled();
    await user.press(screen.getByRole("searchbox"));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();

    await user.type(screen.getByRole("searchbox"), "Tool");

    expect(await screen.findByTestId("web3hub-loading-indicator")).toBeOnTheScreen();
    await waitForElementToBeRemoved(() => screen.getByTestId("web3hub-loading-indicator"), {
      timeout: 1500, // timeout because we mock the request and fake 1s delay
    });

    expect(screen.queryByText("Dummy Wallet App")).not.toBeOnTheScreen();
    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Wallet API Tools")[0]);
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    await user.press(screen.getByTestId("navigation-header-back-button"));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();

    await user.clear(screen.getByRole("searchbox"));
    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.type(screen.getByRole("searchbox"), "Dummy");

    expect(await screen.findByTestId("web3hub-loading-indicator")).toBeOnTheScreen();
    await waitForElementToBeRemoved(() => screen.getByTestId("web3hub-loading-indicator"), {
      timeout: 1500, // timeout because we mock the request and fake 1s delay
    });

    expect(screen.queryByText("Wallet API Tools")).not.toBeOnTheScreen();
    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    await user.press(screen.getByTestId("navigation-header-back-button"));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    await user.press(screen.getByTestId("navigation-header-back-button"));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeDisabled();
  });
});
