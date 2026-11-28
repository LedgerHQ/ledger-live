import { fireEvent, render, screen, userEvent } from "@support/jest/devtools/native";
import type { ReceiveToolAsset } from "../types";
import { Receive } from "./Receive";

const ETHEREUM: ReceiveToolAsset = {
  id: "uuid-eth:ethereum",
  legacyAccountId: "js:2:ethereum:0xabc:",
  assetId: "ethereum",
  label: "Ethereum 1",
  ticker: "ETH",
  currencyId: "ethereum",
  network: "Ethereum",
};

const USDC: ReceiveToolAsset = {
  id: "uuid-eth:ethereum/erc20/usd__coin",
  legacyAccountId: "js:2:ethereum:0xabc:",
  assetId: "ethereum/erc20/usd__coin",
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
  hasSeenVerifyHint = true,
} = {}) => {
  const flag = { enabled, excludedFamilies, setEnabled: jest.fn(), setExcludedFamilies: jest.fn() };
  const trigger = {
    assets,
    onReceive: jest.fn(),
    onPickAsset: jest.fn(),
    onOpenDeeplink: jest.fn(),
  };
  const verifyHint = { hasSeen: hasSeenVerifyHint, setHasSeen: jest.fn() };
  render(<Receive flag={flag} trigger={trigger} verifyHint={verifyHint} />);
  return { flag, trigger, verifyHint };
};

describe("Receive", () => {
  it("turns the flag on", () => {
    const { flag } = renderTool();

    expect(screen.getByText("Feature flag")).toBeOnTheScreen();
    fireEvent(screen.getByLabelText("Enabled"), "onCheckedChange", true);
    expect(flag.setEnabled).toHaveBeenCalledWith(true);
  });

  it("applies the excluded families typed in the input", async () => {
    const user = userEvent.setup();
    const { flag } = renderTool({ enabled: true, excludedFamilies: ["tron"] });

    const input = screen.getByDisplayValue("tron");
    await user.clear(input);
    await user.type(input, " bitcoin, , tezos ");
    await user.press(screen.getByText("Apply"));
    expect(flag.setExcludedFamilies).toHaveBeenCalledWith(["bitcoin", "tezos"]);
  });

  it("lists every asset with its network", () => {
    renderTool();

    expect(screen.getByText("Ethereum 1")).toBeOnTheScreen();
    expect(screen.getByText("USD Coin")).toBeOnTheScreen();
    expect(screen.getAllByText("Ethereum")).toHaveLength(2);
  });

  it("opens receive on the tapped asset", async () => {
    const user = userEvent.setup();
    const { trigger } = renderTool();

    await user.press(screen.getByLabelText("USD Coin, Ethereum"));
    expect(trigger.onReceive).toHaveBeenCalledWith({
      legacyAccountId: "js:2:ethereum:0xabc:",
      assetId: "ethereum/erc20/usd__coin",
    });
  });

  it("opens receive from the asset selection", async () => {
    const user = userEvent.setup();
    const { trigger } = renderTool();

    await user.press(screen.getByText("Pick an asset"));
    expect(trigger.onPickAsset).toHaveBeenCalledTimes(1);
  });

  it("tells there is no account when the list is empty", () => {
    renderTool({ assets: [] });

    expect(screen.getByText("No account yet: pick an asset to add one.")).toBeOnTheScreen();
  });

  it("opens the deeplink typed in the input", async () => {
    const user = userEvent.setup();
    const { trigger } = renderTool();

    const input = screen.getByDisplayValue("ledgerwallet://receive?currency=ethereum");
    await user.clear(input);
    await user.type(input, "ledgerwallet://receive?currency=bitcoin");
    await user.press(screen.getByText("Open"));
    expect(trigger.onOpenDeeplink).toHaveBeenCalledWith("ledgerwallet://receive?currency=bitcoin");
  });

  it.each(["", "not-a-url"])("does not open the invalid deeplink %p", async url => {
    const user = userEvent.setup();
    const { trigger } = renderTool();

    const input = screen.getByDisplayValue("ledgerwallet://receive?currency=ethereum");
    await user.clear(input);
    if (url) await user.type(input, url);
    await user.press(screen.getByText("Open"));
    expect(screen.getByText("Not a valid URL.")).toBeOnTheScreen();
    expect(trigger.onOpenDeeplink).not.toHaveBeenCalled();
  });

  it("shows the deeplink before the receive list, with the verify hint between", () => {
    renderTool();
    const tree = JSON.stringify(screen.toJSON());

    const positions = ["Feature flag", "Deeplink", "Verify hint", "Receive list"].map(title =>
      tree.indexOf(`"${title}"`),
    );
    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("marks the verify hint as seen", async () => {
    const user = userEvent.setup();
    const { verifyHint } = renderTool({ hasSeenVerifyHint: false });

    await user.press(screen.getByLabelText("Show the hint on the next receive"));
    expect(verifyHint.setHasSeen).toHaveBeenCalledWith(true);
  });
});
