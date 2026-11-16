import { fireEvent, render, screen } from "@support/jest/devtools/native";
import type { ReceiveToolAsset } from "../types";
import { Receive } from "./Receive";

const ETHEREUM: ReceiveToolAsset = {
  id: "js:2:ethereum:0xabc:",
  label: "Ethereum 1",
  ticker: "ETH",
  currencyId: "ethereum",
  network: "Ethereum",
};

const USDC: ReceiveToolAsset = {
  id: "js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin",
  label: "USD Coin",
  ticker: "USDC",
  currencyId: "ethereum/erc20/usd__coin",
  network: "Ethereum",
  networkId: "ethereum",
};

const renderTool = ({
  enabled = false,
  excludedFamilies = [] as readonly string[],
  assets = [ETHEREUM, USDC] as readonly ReceiveToolAsset[],
} = {}) => {
  const flag = { enabled, excludedFamilies, setEnabled: jest.fn(), setExcludedFamilies: jest.fn() };
  const trigger = {
    assets,
    onReceive: jest.fn(),
    onPickAsset: jest.fn(),
    onOpenDeeplink: jest.fn(),
  };
  render(<Receive flag={flag} trigger={trigger} />);
  return { flag, trigger };
};

describe("Receive", () => {
  it("turns the flag on", () => {
    const { flag } = renderTool();

    expect(screen.getByText("Feature flag")).toBeOnTheScreen();
    fireEvent(screen.getByLabelText("Enabled"), "onCheckedChange", true);
    expect(flag.setEnabled).toHaveBeenCalledWith(true);
  });

  it("applies the excluded families typed in the input", () => {
    const { flag } = renderTool({ enabled: true, excludedFamilies: ["tron"] });

    fireEvent.changeText(screen.getByDisplayValue("tron"), " bitcoin, , tezos ");
    fireEvent.press(screen.getByText("Apply"));
    expect(flag.setExcludedFamilies).toHaveBeenCalledWith(["bitcoin", "tezos"]);
  });

  it("lists every asset with its network", () => {
    renderTool();

    expect(screen.getByText("Ethereum 1")).toBeOnTheScreen();
    expect(screen.getByText("USD Coin")).toBeOnTheScreen();
    expect(screen.getAllByText("Ethereum")).toHaveLength(2);
  });

  it("opens receive on the tapped asset", () => {
    const { trigger } = renderTool();

    fireEvent.press(screen.getByLabelText("USD Coin"));
    expect(trigger.onReceive).toHaveBeenCalledWith(USDC.id);
  });

  it("opens receive from the asset selection", () => {
    const { trigger } = renderTool();

    fireEvent.press(screen.getByText("Pick an asset"));
    expect(trigger.onPickAsset).toHaveBeenCalledTimes(1);
  });

  it("tells there is no account when the list is empty", () => {
    renderTool({ assets: [] });

    expect(screen.getByText("No account yet: pick an asset to add one.")).toBeOnTheScreen();
  });

  it("opens the deeplink typed in the input", () => {
    const { trigger } = renderTool();

    fireEvent.changeText(
      screen.getByDisplayValue("ledgerwallet://receive?currency=ethereum"),
      "ledgerwallet://receive?currency=bitcoin",
    );
    fireEvent.press(screen.getByText("Open"));
    expect(trigger.onOpenDeeplink).toHaveBeenCalledWith("ledgerwallet://receive?currency=bitcoin");
  });
});
