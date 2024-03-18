import * as React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { MarketPages } from "./shared";
import { State } from "~/reducers/types";

describe("Market integration test", () => {
  it("Should set some coins as favorites", async () => {
    const { user } = render(<MarketPages />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          featureFlags: { llmMarketNewArch: { enabled: true } },
        },
      }),
    });

    //Set BTC as favorite
    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();

    await user.press(screen.getByText("Bitcoin (BTC)"));
    await user.press(await screen.findByTestId("star-asset"));
    await user.press(screen.getByTestId("market-back-btn"));

    const ethRow = await screen.findByText("Ethereum (ETH)");

    await user.press(await screen.findByTestId("starred"));

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(ethRow).not.toBeOnTheScreen();

    //Set BNB as favorite
    await user.press(await screen.findByTestId("starred"));
    await user.press(await screen.findByText("BNB (BNB)"));
    await user.press(await screen.findByTestId("star-asset"));
    await user.press(screen.getByTestId("market-back-btn"));
    const ethRow2 = await screen.findByText("Ethereum (ETH)");

    await user.press(await screen.findByTestId("starred"));

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("BNB (BNB)")).toBeOnTheScreen();
    expect(ethRow2).not.toBeOnTheScreen();
  }, 10000);
});
