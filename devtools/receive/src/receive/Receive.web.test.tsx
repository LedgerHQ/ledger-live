import { render, screen } from "@support/jest/devtools/web";
import userEvent from "@testing-library/user-event";
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
  it("turns the flag on", async () => {
    const { flag } = renderTool();

    expect(screen.getByRole("heading", { name: "Feature flag" })).toBeVisible();
    await userEvent.click(screen.getByRole("switch", { name: "Enabled" }));
    expect(flag.setEnabled).toHaveBeenCalledWith(true);
  });

  it("applies the excluded families typed in the input", async () => {
    const { flag } = renderTool({ enabled: true, excludedFamilies: ["tron"] });

    const input = screen.getByDisplayValue("tron");
    await userEvent.clear(input);
    await userEvent.type(input, " bitcoin, , tezos ");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(flag.setExcludedFamilies).toHaveBeenCalledWith(["bitcoin", "tezos"]);
  });

  it("lists every asset with its network", () => {
    renderTool();

    expect(screen.getByText("Ethereum 1")).toBeVisible();
    expect(screen.getByText("USD Coin")).toBeVisible();
    expect(screen.getAllByText("Ethereum")).toHaveLength(2);
  });

  it("opens receive on the tapped asset", async () => {
    const { trigger } = renderTool();

    await userEvent.click(screen.getByRole("button", { name: /USD Coin/ }));
    expect(trigger.onReceive).toHaveBeenCalledWith(USDC.id);
  });

  it("opens receive from the asset selection", async () => {
    const { trigger } = renderTool();

    await userEvent.click(screen.getByRole("button", { name: "Pick an asset" }));
    expect(trigger.onPickAsset).toHaveBeenCalledTimes(1);
  });

  it("tells there is no account when the list is empty", () => {
    renderTool({ assets: [] });

    expect(screen.getByText("No account yet: pick an asset to add one.")).toBeVisible();
  });

  it("opens the prefilled receive deeplink", async () => {
    const { trigger } = renderTool();

    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(trigger.onOpenDeeplink).toHaveBeenCalledWith("ledgerwallet://receive?currency=ethereum");
  });

  it("opens the deeplink typed in the input", async () => {
    const { trigger } = renderTool();

    const input = screen.getByDisplayValue("ledgerwallet://receive?currency=ethereum");
    await userEvent.clear(input);
    await userEvent.type(input, "ledgerwallet://receive?currency=bitcoin");
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(trigger.onOpenDeeplink).toHaveBeenCalledWith("ledgerwallet://receive?currency=bitcoin");
  });
});
