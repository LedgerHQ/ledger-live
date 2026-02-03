import React from "react";
import { useArgs } from "storybook/manager-api";

import SideBar from "./SideBar";
import type { SideBarProps } from "./SideBar";
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
      <SideBar.Item onClick={() => {}} label="portfolio">
        <PortfolioIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={() => {}} label="accounts" isActive>
        <WalletIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={() => {}} label="discover" isDisabled>
        <ManagerIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={() => {}} label="send" isDisabled>
        <ArrowTopIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={() => {}} label="receive">
        <ArrowBottomIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={() => {}} label="buy / Sell">
        <BuyCryptoAltIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={() => {}} label="exchange">
        <BuyCryptoIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={() => {}} label="lend">
        <LendIcon size={sidebarIconSize} />
      </SideBar.Item>
      <SideBar.Item onClick={() => {}} label="manager" displayNotificationBadge>
        <NanoFoldedIcon size={sidebarIconSize} />
      </SideBar.Item>
    </SideBar>
  );
};

export const Default: StoryTemplate<SideBarProps> = Template.bind({});
Default.args = {
  onToggle: () => {},
  isExpanded: true,
};
