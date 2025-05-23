import SelectAssetFlow from ".";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { track } from "~/renderer/analytics/__mocks__/segment";

type Story = StoryObj<typeof SelectAssetFlow>;

const onAssetSelected = fn();

const Meta: Meta<typeof SelectAssetFlow> = {
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
      expect.objectContaining({ name: "Arbitrum", family: "evm" }),
    );
    expect(track).lastCalledWith("network_clicked", {
      flow: "Modular Asset Flow",
      network: "arbitrum",
      page: "Modular Asset Flow",
    });
  },
};
