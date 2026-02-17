import {
  SideBarLeading,
  SideBarItem,
  SideBarTrailing,
  SideBar,
  SideBarCollapseToggle,
} from "@ledgerhq/lumen-ui-react";
import {
  CreditCardFill,
  CreditCard,
  Home,
  HomeFill,
  Wallet,
  Exchange,
  ExchangeFill,
  Gift,
  ShieldCheck,
  Chart2,
  Compass,
} from "@ledgerhq/lumen-ui-react/symbols";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import React from "react";
import { useTranslation } from "react-i18next";
import type { SideBarViewModel } from "./types";
import { AnimatedLogo } from "../AnimatedLogo";

export interface SideBarViewProps {
  readonly viewModel: SideBarViewModel;
}

export function SideBarView({ viewModel }: SideBarViewProps) {
  const { t } = useTranslation();

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-24 pt-24 pb-40 pl-32">
      <div className="flex h-48 w-0 items-center justify-center justify-self-center overflow-visible">
        <AnimatedLogo collapsed={viewModel.collapsed} />
      </div>

      <div className="min-h-0">
        <SideBar
          active={viewModel.active}
          onActiveChange={viewModel.handleActiveChange}
          collapsed={viewModel.collapsed}
          onCollapsedChange={viewModel.handleCollapsedChange}
        >
          <SideBarLeading>
            <SideBarItem
              value="home"
              icon={Home}
              activeIcon={HomeFill}
              label={t("dashboard.title")}
            />
            <SideBarItem
              value="accounts"
              icon={Wallet}
              activeIcon={Wallet}
              label={t("sidebar.accounts")}
            />
            <SideBarItem
              value="swap"
              icon={Exchange}
              activeIcon={ExchangeFill}
              label={t("sidebar.swap")}
            />
            <SideBarItem
              value="earn"
              icon={Chart2}
              activeIcon={Chart2}
              label={viewModel.earnLabel}
            />
            <SideBarItem
              value="discover"
              icon={Compass}
              activeIcon={Compass}
              label={t("sidebar.catalog")}
            />
            <SideBarItem
              value="card"
              icon={CreditCard}
              activeIcon={CreditCardFill}
              label={t("sidebar.card")}
              disabled={viewModel.isCardDisabled}
            />
          </SideBarLeading>
          <SideBarTrailing>
            <FeatureToggle featureId="referralProgramDesktopSidebar">
              <SideBarItem value="refer" icon={Gift} activeIcon={Gift} label={t("sidebar.refer")} />
            </FeatureToggle>
            <FeatureToggle featureId="protectServicesDesktop">
              <SideBarItem
                value="recover"
                icon={ShieldCheck}
                activeIcon={ShieldCheck}
                label={t("sidebar.recover")}
              />
            </FeatureToggle>
            <SideBarCollapseToggle />
          </SideBarTrailing>
        </SideBar>
      </div>
    </div>
  );
}
