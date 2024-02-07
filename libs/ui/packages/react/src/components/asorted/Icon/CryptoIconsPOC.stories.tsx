import React from "react";
import { Meta, Story } from "@storybook/react";
import CryptoIconPOC, {
  Props as CryptoIconProps,
  CryptoIconsProvider,
  useCryptoIcons,
} from "./CryptoIconPOC";

export default {
  title: "Asorted/CryptoIconPOC",
  component: CryptoIconPOC,
  decorators: [
    (Story: React.ComponentType) => (
      <CryptoIconsProvider>
        <Story />
      </CryptoIconsProvider>
    ),
  ],
} as Meta;

type TemplateProps = CryptoIconProps;

const availableTokens = [
  "bitcoin",
  "ethereum",
  "ethereum-classic",
  "celestia",
  "tronclassic",
  "tether",
];

const Template: Story<TemplateProps> = ({
  size = 32,
  circleIcon = false,
  iconURL = "bitcoin",
  tokenIconURL = "ethereum",
  backgroundColor = "dark_blue",
}) => {
  const { getCryptoIcon, cryptoIcons } = useCryptoIcons();

  const selectedIconUrl = iconURL || availableTokens[0];
  const selectedTokenIconUrl = tokenIconURL || availableTokens[1];

  // Use an array of IDs to ensure getCryptoIcon is called with the correct data
  getCryptoIcon([selectedIconUrl, selectedTokenIconUrl]);

  console.log("sbCryptoIcons", cryptoIcons);

  return (
    <CryptoIconPOC
      size={size || 32}
      circleIcon={circleIcon || false}
      iconURL={cryptoIcons[selectedIconUrl] || ""}
      tokenIconURL={cryptoIcons[selectedTokenIconUrl] || ""}
      backgroundColor={backgroundColor}
    />
  );
};

export const Default: Story<TemplateProps> = Template.bind({});
Default.args = {
  size: 32,
  circleIcon: false,
  iconURL: "bitcoin",
  tokenIconURL: "ethereum",
  backgroundColor: "dark_blue",
};
