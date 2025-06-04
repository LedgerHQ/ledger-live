import React from "react";
import AssetSelection from "../AssetSelection";
import type { Meta, StoryObj } from "@storybook/react";
import {
  arbitrumCurrency,
  bitcoinCurrency,
  ethereumCurrency,
  bitcoinAssetType,
  ethereumAssetType,
  arbitrumAssetType,
  mockAssetsConfiguration,
} from "../../__mocks__/useSelectAssetFlow.mock";
import { fn } from "@storybook/test";

const assetsToDisplay = [ethereumCurrency, arbitrumCurrency, bitcoinCurrency];
const sortedCryptoCurrencies = [bitcoinCurrency, ethereumCurrency, arbitrumCurrency];
const onAssetSelected = fn();
const setAssetsToDisplay = fn();
const setSearchedValue = fn();

const meta: Meta<typeof AssetSelection> = {
  title: "ModularDrawer/AssetSelection",
  component: AssetSelection,
  args: {
    assetTypes: [bitcoinAssetType, ethereumAssetType, arbitrumAssetType],
    assetsToDisplay,
    sortedCryptoCurrencies,
    assetsConfiguration: mockAssetsConfiguration,
    setAssetsToDisplay: setAssetsToDisplay,
    onAssetSelected: onAssetSelected,
    setSearchedValue: setSearchedValue,
  },
  decorators: [
    Story => (
      <div style={{ width: "100%", height: "100%" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof AssetSelection>;

export const Default: Story = {};

export const WithDefaultSearchValue: Story = {
  args: {
    defaultSearchValue: "eth",
  },
};

export const EmptyAssets: Story = {
  args: {
    assetsToDisplay: [],
    sortedCryptoCurrencies: [],
  },
};
