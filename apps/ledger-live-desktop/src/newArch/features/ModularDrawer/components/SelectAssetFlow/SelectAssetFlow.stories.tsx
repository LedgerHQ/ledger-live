import React from "react";
import SelectAssetFlow from ".";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { track } from "~/renderer/analytics/__mocks__/segment";
import { arbitrumCurrency } from "./__mocks__/useSelectAssetFlow.mock";

type Story = StoryObj<typeof SelectAssetFlow>;

const onAssetSelected = fn();

const Meta: Meta<typeof SelectAssetFlow> = {
  decorators: [
    Story => (
      <div style={{ height: 500 }}>
        <Story />
      </div>
    ),
  ],
  component: SelectAssetFlow,
  title: "SelectAssetFlow",
  tags: ["autodocs"],
  args: {
    onAssetSelected,
    currencies: [],
  },
};

export default Meta;

export const SelectAssetAndNetworkTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ethereum = canvas.getByText(/ethereum/i);
    await userEvent.click(ethereum);

    expect(track).lastCalledWith("asset_clicked", {
      asset: {
        id: "ethereum",
        name: "Ethereum",
        ticker: "ETH",
      },
      flow: "Modular Asset Flow",
      page: "Modular Asset Selection",
    });

    const ethereumNetwork = canvas.getByText(/ethereum/i);
    const arbitrumNetwork = canvas.getByText(/arbitrum/i);
    expect(ethereumNetwork).toBeInTheDocument();
    expect(arbitrumNetwork).toBeInTheDocument();

    await userEvent.click(arbitrumNetwork);

    expect(onAssetSelected).toBeCalledWith(
      expect.objectContaining(arbitrumCurrency.parentCurrency),
    );
    expect(track).lastCalledWith("network_clicked", {
      flow: "Modular Asset Flow",
      network: "arbitrum",
      page: "Modular Asset Flow",
    });
  },
};

export const SelectNetworkFrom1CurrencyTest: Story = {
  args: {
    currencies: [arbitrumCurrency],
  },
  play: async () => {
    expect(onAssetSelected).toBeCalledWith(arbitrumCurrency);
  },
};
