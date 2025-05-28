import React from "react";
import { NavigateBackButton } from "./NavigateBackButton";
import styled from "styled-components";
import { Title } from "./Title";
import { ModularDrawerStep, MODULAR_DRAWER_STEP } from "../../types";
import { track } from "~/renderer/analytics/segment";
import { AnimatePresence, motion } from "framer-motion";

type Props =
  | {
      step: ModularDrawerStep;
      hidden: true;
      onBackClick?: () => void;
    }
  | {
      step: ModularDrawerStep;
      hidden?: false | undefined;
      onBackClick: () => void;
    };

const TranslationKeyMap: Record<ModularDrawerStep, string> = {
  [MODULAR_DRAWER_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DRAWER_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DRAWER_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
};

export const Header = ({ step, hidden, onBackClick }: Props) => {
  const handleBackClick = () => {
    track("button_clicked", {
      step,
      button: "ModularDrawerBackButton",
    });
    onBackClick?.();
  };

  return (
    <HeaderContainer>
      <AnimatePresence mode="wait">
        <motion.span
          key={`back-button-${step}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          data-testid="select-asset-drawer-back-button"
        >
          <NavigateBackButton hidden={hidden} onClick={handleBackClick} />
        </motion.span>
      </AnimatePresence>
      <Title translationKey={TranslationKeyMap[step]} />
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  padding: 0px 0 16px 24px;
  flex: 0 1 auto;
  width: 100%;
  display: flex;
  align-items: center;
`;
