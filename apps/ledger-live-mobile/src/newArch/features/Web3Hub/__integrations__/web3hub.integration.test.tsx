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

async function waitForLoader() {
  expect(await screen.findByRole("progressbar")).toBeOnTheScreen();
  await waitForElementToBeRemoved(() => screen.getByRole("progressbar"), {
    timeout: 1500, // timeout because we mock the return and fake 1s delay
  });
}

describe("Web3Hub integration test", () => {
  it("Should list manifests and navigate to app page", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    await waitForLoader();

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    expect(await screen.findByRole("button", { name: /back/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Wallet API Tools")[0]);
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
  });

  it("Should list manifests, go to search and navigate to app page", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    await waitForLoader();

    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeDisabled();
    await user.press(screen.getByRole("searchbox"));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Wallet API Tools")[0]);
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeDisabled();
  });

  it("Should list manifests, select a category and navigate to app page", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    await waitForLoader();

    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();

    expect(await screen.findByText("games")).toBeOnTheScreen();
    await user.press(screen.getByText("games"));

    await waitForLoader();

    expect(screen.queryByText("Wallet API Tools")).not.toBeOnTheScreen();
    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    // scroll to reveal the end of the list
    await user.scrollTo(screen.getByTestId("web3hub-categories-scroll"), { x: 500 });
    expect(await screen.findByText("other")).toBeOnTheScreen();
    await user.press(screen.getByText("other"));

    await waitForLoader();

    expect(screen.queryByText("Dummy Wallet App")).not.toBeOnTheScreen();
    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Wallet API Tools")[0]);
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
  });

  it("Should list manifests, go to search and search an app and go it app page", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    await waitForLoader();

    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeDisabled();
    await user.press(screen.getByRole("searchbox"));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();

    await user.type(screen.getByRole("searchbox"), "Tool");

    await waitForLoader();

    expect(screen.queryByText("Dummy Wallet App")).not.toBeOnTheScreen();
    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Wallet API Tools")[0]);
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();

    await user.clear(screen.getByRole("searchbox"));
    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.type(screen.getByRole("searchbox"), "Dummy");

    await waitForLoader();

    expect(screen.queryByText("Wallet API Tools")).not.toBeOnTheScreen();
    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeDisabled();
  });

  it("Should go to tabs from main, search and app pages", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect(await screen.findByRole("button", { name: /2/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /2/i }));

    expect(await screen.findByText("Web3HubTabs")).toBeOnTheScreen();
    expect(await screen.findByText("N Tabs")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeDisabled();
    await user.press(screen.getByRole("searchbox"));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    expect(await screen.findByRole("button", { name: /2/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /2/i }));

    expect(await screen.findByText("Web3HubTabs")).toBeOnTheScreen();
    expect(await screen.findByText("N Tabs")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Wallet API Tools")[0]);
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    expect(await screen.findByRole("button", { name: /2/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /2/i }));

    expect(await screen.findByText("Web3HubTabs")).toBeOnTheScreen();
    expect(await screen.findByText("N Tabs")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeDisabled();
  });
});
