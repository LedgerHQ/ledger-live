import React from "react";
import { render, screen } from "tests/testSetup";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import {
  ethereumCurrency,
  bitcoinCurrency,
  arbitrumCurrency,
} from "../__mocks__/useSelectAssetFlow.mock";
import { useGroupedCurrenciesByProvider } from "../__mocks__/useGroupedCurrenciesByProvider.mock";

const mockOnAssetSelected = jest.fn();

const currencies = [ethereumCurrency, bitcoinCurrency, arbitrumCurrency];
jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

jest.mock("framer-motion", () => {
  return {
    motion: new Proxy(
      {},
      {
        get: (target, prop) => {
          const Comp = React.forwardRef((props: unknown, ref: unknown) =>
            React.createElement(
              prop as string,
              Object.assign({}, typeof props === "object" && props !== null ? props : {}, { ref }),
            ),
          );
          Comp.displayName = typeof prop === "string" ? prop : "motionComponent";
          return Comp;
        },
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  } as unknown as typeof import("framer-motion");
});

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 800,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 800,
  });
  HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      width: 800,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    };
  };
});

describe("ModularDrawerFlowManager - Select Network Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render AssetSelection step with correct props", () => {
    render(
      <ModularDrawerFlowManager currencies={currencies} onAssetSelected={mockOnAssetSelected} />,
    );

    expect(screen.getByText(/select asset/i)).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.getByText(/bitcoin/i)).toBeVisible();
  });

  it("should call onAssetSelected when an asset is selected", async () => {
    const { user } = render(
      <ModularDrawerFlowManager currencies={currencies} onAssetSelected={mockOnAssetSelected} />,
    );

    const bitcoinAsset = screen.getByText(/bitcoin/i);
    await user.click(bitcoinAsset);

    expect(mockOnAssetSelected).toHaveBeenCalledWith(bitcoinCurrency);
  });

  it("should navigate to NetworkSelection step after asset selection", async () => {
    const { user } = render(
      <ModularDrawerFlowManager currencies={currencies} onAssetSelected={mockOnAssetSelected} />,
    );

    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    expect(screen.getByText(/select network/i)).toBeVisible();
    expect(screen.getByText(/ethereum/i)).toBeVisible();
    expect(screen.queryByText(/arbitrum/i)).toBeVisible();
    expect(screen.queryByText(/bitcoin/i)).not.toBeInTheDocument();
  });

  it("should call onAssetSelected after network selection", async () => {
    const { user } = render(
      <ModularDrawerFlowManager currencies={currencies} onAssetSelected={mockOnAssetSelected} />,
    );

    const ethereumAsset = screen.getByText(/ethereum/i);
    await user.click(ethereumAsset);

    const arbitrumNetwork = screen.getByText(/arbitrum/i);
    await user.click(arbitrumNetwork);

    expect(mockOnAssetSelected).toHaveBeenCalledWith(arbitrumCurrency);
  });
});
