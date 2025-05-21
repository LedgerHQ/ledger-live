import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Text } from "@ledgerhq/react-ui";
import { NavigateBackButton } from "./NavigateBackButton";
import { ANIMATION_VARIANTS, NavigationDirection } from "./navigation";
import styled from "styled-components";

export type HeaderProps = {
  navDirection: NavigationDirection;
  navKey: string;
  onBackClick: () => void;
  showBackButton?: boolean;
  title: string;
};

export function Header({
  navDirection,
  navKey,
  onBackClick,
  showBackButton = true,
  title,
}: Readonly<HeaderProps>) {
  const { t } = useTranslation();

  const titleTemplate = t("modularAssetDrawer.assetFlow.selectTemplate", {
    dynamic: "{{dynamic}}",
  });

  const [beforeDynamic, afterDynamic] = titleTemplate.split("{{dynamic}}");

  return (
    <HeaderContainer>
      <NavigateBackButton hidden={!showBackButton} onClick={onBackClick} />
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
        {beforeDynamic}
        <AnimatePresence mode="wait" custom={navDirection}>
          <motion.span
            key={navKey}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={ANIMATION_VARIANTS}
            custom={navDirection}
            data-testid="select-asset-drawer-title-dynamic"
          >
            {title}
          </motion.span>
        </AnimatePresence>
        {afterDynamic}
      </Text>
    </HeaderContainer>
  );
}

const HeaderContainer = styled.div`
  padding: 54px 0 16px 24px;
  flex: 0 1 auto;
  width: 100%;
  display: flex;
  align-items: center;
`;
