import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Text } from "@ledgerhq/react-ui";
import { HeaderContainer } from "./StyledComponents";
import { NavigateBackButton } from "./NavigateBackButton";
import { ANIMATION_VARIANTS, NavigationDirection, FlowStep } from "../useSelectAssetFlow";

export type HeaderProps = {
  isAssetSelectionVisible: boolean;
  currentStep: FlowStep;
  navDirection: NavigationDirection;
  onBackClick: () => void;
};

export function Header({
  isAssetSelectionVisible,
  currentStep,
  navDirection,
  onBackClick,
}: Readonly<HeaderProps>) {
  const { t } = useTranslation();

  const isAssetSelection = currentStep === FlowStep.SELECT_ASSET_TYPE;
  const titleText = isAssetSelection
    ? t("modularAssetDrawer.assetFlow.asset")
    : t("modularAssetDrawer.assetFlow.network");

  return (
    <HeaderContainer>
      <NavigateBackButton hidden={isAssetSelectionVisible} onClick={onBackClick} />
      <Text
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-start"
        columnGap={1}
        fontSize={24}
        fontWeight="semiBold"
        color="palette.text.shade100"
        data-testid="select-asset-drawer-title"
      >
        {t("modularAssetDrawer.assetFlow.select")}
        <AnimatePresence mode="wait" custom={navDirection}>
          <motion.span
            key={currentStep}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={ANIMATION_VARIANTS}
            custom={navDirection}
            data-testid="select-asset-drawer-title-dynamic"
          >
            {titleText}
          </motion.span>
        </AnimatePresence>
      </Text>
    </HeaderContainer>
  );
}
