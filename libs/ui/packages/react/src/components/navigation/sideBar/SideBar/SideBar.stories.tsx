import React from "react";
// @ts-expect-error Typings…
import { useArgs } from "@storybook/client-api";

import SideBar from "./SideBar";
import type { SideBarProps } from "./SideBar";
import { action } from "@storybook/addon-actions";
import PortfolioIcon from "@ledgerhq/icons-ui/reactLegacy/PortfolioMedium";
import WalletIcon from "@ledgerhq/icons-ui/reactLegacy/WalletMedium";
import ManagerIcon from "@ledgerhq/icons-ui/reactLegacy/ManagerMedium";
import ArrowTopIcon from "@ledgerhq/icons-ui/reactLegacy/ArrowTopMedium";
import ArrowBottomIcon from "@ledgerhq/icons-ui/reactLegacy/ArrowBottomMedium";
import BuyCryptoAltIcon from "@ledgerhq/icons-ui/reactLegacy/BuyCryptoAltMedium";
import BuyCryptoIcon from "@ledgerhq/icons-ui/reactLegacy/BuyCryptoMedium";
import LendIcon from "@ledgerhq/icons-ui/reactLegacy/LendMedium";
import NanoFoldedIcon from "@ledgerhq/icons-ui/reactLegacy/NanoFoldedMedium";
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

  const sidebarIconSize = 20;
  return (
    <SideBar {...args} onToggle={handleToggle}>
      <SideBar.Item onClick={action("go to portfolio")} label="portfolio">
        <PortfolioIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to accounts")} label="accounts" isActive>
        <WalletIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to discover")} label="discover" isDisabled>
        <ManagerIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to send")} label="send" isDisabled>
        <ArrowTopIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to receive")} label="receive">
        <ArrowBottomIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to buy / Sell")} label="buy / Sell">
        <BuyCryptoAltIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to exchange")} label="exchange">
        <BuyCryptoIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to lend")} label="lend">
        <LendIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={action("go to manager")} label="manager" displayNotificationBadge>
        <NanoFoldedIcon size={sidebarIconSize} />
      </SideBar.Item>
    </SideBar>
  );
};

export const Default: StoryTemplate<SideBarProps> = Template.bind({});
Default.args = {
  onToggle: action("toggle sidebar"),
  isExpanded: true,
};
