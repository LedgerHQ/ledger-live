import React from "react";
import CryptoIconPOC, {
  CryptoIconsProvider,
  useCryptoIcons,
} from "../../../src/components/Icon/CryptoIconPOC";
import { ComponentStory } from "@storybook/react-native";

export default {
  title: "Icon/CryptoIconPOC",
  component: CryptoIconPOC,
  decorators: [
    (Story: () => JSX.Element) => (
      <CryptoIconsProvider>
        <Story />
      </CryptoIconsProvider>
    ),
  ],
};

const availableTokens = [
  "bitcoin",
  "ethereum",
  "ethereum-classic",
  "celestia",
  "tronclassic",
  "tether",
];

const Template: ComponentStory<typeof CryptoIconPOC> = ({
  size = 32,
  circleIcon = true,
  iconURL = "bitcoin",
  tokenIconURL = "ethereum",
  backgroundColor = "dark_blue",
}) => {
  const { getCryptoIcon } = useCryptoIcons();

  return (
    <CryptoIconPOC
      size={size || 32}
      circleIcon={circleIcon || false}
      iconURL={getCryptoIcon(iconURL || availableTokens[0]) || ""}
      tokenIconURL={getCryptoIcon(tokenIconURL || availableTokens[1]) || ""}
      backgroundColor={backgroundColor}
    />
  );
};

export const Default: ComponentStory<typeof CryptoIconPOC> = Template.bind({});
Default.args = {
  size: 32,
  circleIcon: true,
  iconURL: "bitcoin",
  tokenIconURL: "ethereum",
  backgroundColor: "dark_blue",
};
