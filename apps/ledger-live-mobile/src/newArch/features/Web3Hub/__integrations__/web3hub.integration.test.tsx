import * as React from "react";
import { screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { Web3HubTest } from "./shared";
import { Text } from "@ledgerhq/native-ui";
import deviceStorage from "~/logic/storeWrapper";

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

jest.mock("react-native-view-shot", () => ({
  captureScreen: jest.fn().mockResolvedValue("mock-uri.jpg"),
}));

async function waitForLoader() {
  expect(await screen.findByRole("progressbar")).toBeOnTheScreen();
  await waitForElementToBeRemoved(() => screen.getByRole("progressbar"), {
    timeout: 1500, // timeout because we mock the return and fake 1s delay
  });
}

describe("Web3Hub integration test", () => {
  beforeEach(() => {
    deviceStorage.delete("web3hub__TabHistory");
  });

  it("Should list manifests and navigate to app page", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    await waitForLoader();

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("Do not remind me again.")).toBeOnTheScreen();
    expect(await screen.findByText("Open Dummy Wallet App")).toBeOnTheScreen();
    await user.press(screen.getByText("Open Dummy Wallet App"));
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
    expect(await screen.findByText("Do not remind me again.")).toBeOnTheScreen();
    expect(await screen.findByText("Open Dummy Wallet App")).toBeOnTheScreen();
    await user.press(screen.getByText("Open Dummy Wallet App"));
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
    expect(await screen.findByText("Do not remind me again.")).toBeOnTheScreen();
    expect(await screen.findByText("Open Dummy Wallet App")).toBeOnTheScreen();
    await user.press(screen.getByText("Open Dummy Wallet App"));
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
    expect(await screen.findByText("Do not remind me again.")).toBeOnTheScreen();
    expect(await screen.findByText("Open Dummy Wallet App")).toBeOnTheScreen();
    await user.press(screen.getByText("Open Dummy Wallet App"));
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

    expect(await screen.findByRole("button", { name: /0/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /0/i }));

    expect(await screen.findByText("New tab")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeDisabled();
    await user.press(screen.getByRole("searchbox"));
    expect(await screen.findByRole("searchbox")).toBeOnTheScreen();
    expect(screen.getByRole("searchbox")).toBeEnabled();

    expect(await screen.findByRole("button", { name: /0/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /0/i }));

    expect(await screen.findByText("New tab")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: /back/i }));

    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Wallet API Tools")[0]);
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    expect(await screen.findByRole("button", { name: /0/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /0/i }));

    expect(await screen.findByText("New tab")).toBeOnTheScreen();

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

  it("Should be able to see Clear Signing section and label on disclaimer", async () => {
    const { user } = render(<Web3HubTest />);
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
    await waitForLoader();

    expect((await screen.findAllByText("Clear signing"))[0]).toBeOnTheScreen();
    expect((await screen.findAllByRole("banner", { name: /clear signing/i }))[0]).toBeOnTheScreen();

    expect((await screen.findAllByText("Clear-signing"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Clear-signing")[0]);
    expect(await screen.findByText("Clear signing enabled")).toBeOnTheScreen();

    expect(await screen.findByText("Open Clear-signing")).toBeOnTheScreen();
    await user.press(screen.getByText("Open Clear-signing"));
    expect(await screen.findByText("clear-signing-0")).toBeOnTheScreen();
    expect(await screen.findByText("Clear-signing")).toBeOnTheScreen();

    expect(await screen.findByRole("button", { name: /back/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("Clear signing disabled")).toBeOnTheScreen();
  });

  it("Should only show the confirmation bottom modal if not dismissed previously", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    await waitForLoader();

    // TODO: Would be nice to test the close on bottom modal by tapping the close icon or the backdrop
    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("Do not remind me again.")).toBeOnTheScreen();
    // await user.press(screen.getByText("Do not remind me again."));
    expect(await screen.findByText("Open Dummy Wallet App")).toBeOnTheScreen();
    await user.press(screen.getByText("Open Dummy Wallet App"));
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    expect(await screen.findByRole("button", { name: /back/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("Do not remind me again.")).toBeOnTheScreen();
    await user.press(screen.getByText("Do not remind me again."));
    expect(await screen.findByText("Open Dummy Wallet App")).toBeOnTheScreen();
    await user.press(screen.getByText("Open Dummy Wallet App"));
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    expect(await screen.findByRole("button", { name: /back/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    // Strange bug where I need to press on something else (that will not receive the press) to be able to press again
    await user.press(screen.getAllByText("Dummy Wallet App")[1]);
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    expect(await screen.findByRole("button", { name: /back/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();
  });

  it("Should navigate to app page, capture it, list the tabs and increments the tab counter", async () => {
    const { user } = render(<Web3HubTest />);

    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    await waitForLoader();

    expect((await screen.findAllByText("Dummy Wallet App"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Dummy Wallet App")[0]);
    expect(await screen.findByText("Open Dummy Wallet App")).toBeOnTheScreen();
    await user.press(screen.getByText("Open Dummy Wallet App"));
    expect(await screen.findByText("dummy-0")).toBeOnTheScreen();
    expect(await screen.findByText("Dummy Wallet App")).toBeOnTheScreen();

    expect(await screen.findByRole("button", { name: /0/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /0/i }));
    expect(await screen.findByText("New tab")).toBeOnTheScreen();

    expect(await screen.findByText("New tab")).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByText("1 tab")).toBeOnTheScreen());
    await waitFor(() => expect(screen.getByTestId("web3hub-tab-item-dummy-0")).toBeOnTheScreen());

    expect(await screen.findByRole("button", { name: /back/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByRole("button", { name: /back/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByText("Explore web3")).toBeOnTheScreen();

    expect((await screen.findAllByText("Wallet API Tools"))[0]).toBeOnTheScreen();
    await user.press(screen.getAllByText("Wallet API Tools")[0]);
    expect(await screen.findByText("wallet-api-tools-0")).toBeOnTheScreen();
    expect(await screen.findByText("Wallet API Tools")).toBeOnTheScreen();

    expect(await screen.findByRole("button", { name: /1/i })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: /1/i }));

    expect(await screen.findByText("New tab")).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByText("2 tabs")).toBeOnTheScreen());
    await waitFor(() => expect(screen.getByTestId(/wallet-api-tools-0/)).toBeOnTheScreen());
  });
});
