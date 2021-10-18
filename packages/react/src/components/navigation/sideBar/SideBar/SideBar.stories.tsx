import React from "react";
import { useArgs } from "@storybook/client-api";

import SideBar from "./SideBar";
import type { SideBarProps } from "./SideBar";
import { action } from "@storybook/addon-actions";
import PortfolioIcon from "../../../../assets/icons/PortfolioMedium";
import WalletIcon from "../../../../assets/icons/WalletMedium";
import ManagerIcon from "../../../../assets/icons/ManagerMedium";
import ArrowTopIcon from "../../../../assets/icons/ArrowTopMedium";
import ArrowBottomIcon from "../../../../assets/icons/ArrowBottomMedium";
import BuyCryptoAltIcon from "../../../../assets/icons/BuyCryptoAltMedium";
import BuyCryptoIcon from "../../../../assets/icons/BuyCryptoMedium";
import LendIcon from "../../../../assets/icons/LendMedium";
import NanoFoldedIcon from "../../../../assets/icons/NanoFoldedMedium";
import { StoryTemplate } from "../../../helpers";

export default {
  title: "Navigation/SideBar/SideBar",
  component: SideBar,
  argTypes: {
    children: {
      type: "text",
      description: "A list a SideBar.Item",
      required: true,
      control: false,
    },
    isExpanded: { control: false },
    onToggle: { control: false },
  },
};

const Template = (args: SideBarProps) => {
  const [currentArgs, updateArgs] = useArgs();

  const handleToggle = () => updateArgs({ isExpanded: !currentArgs.isExpanded });

  return (
    <SideBar {...args} onToggle={handleToggle}>
      <SideBar.Item onClick={action("go to portfolio")} label="portfolio">
        <PortfolioIcon />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to accounts")} label="accounts" isActive>
        <WalletIcon />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to discover")} label="discover" isDisabled>
        <ManagerIcon />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to send")} label="send" isDisabled>
        <ArrowTopIcon />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to receive")} label="receive">
        <ArrowBottomIcon />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to buy / Sell")} label="buy / Sell">
        <BuyCryptoAltIcon />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to exchange")} label="exchange">
        <BuyCryptoIcon />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to lend")} label="lend">
        <LendIcon />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to manager")} label="manager">
        <NanoFoldedIcon />
      </SideBar.Item>
    </SideBar>
  );
};

export const Default: StoryTemplate<SideBarProps> = Template.bind({});
Default.args = {
  onToggle: action("toggle sidebar"),
  isExpanded: true,
};
