import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Text } from "@ledgerhq/react-ui";
import { HeaderContainer } from "./StyledComponents";
import { NavigateBackButton } from "../../NavigateBackButton";
import { ANIMATION_VARIANTS, NavigationDirection } from "../../SelectAssetFlow/useSelectAssetFlow";

export type HeaderProps = {
  navDirection: NavigationDirection;
  ticker: string;
  onBackClick: () => void;
};

export function Header({ navDirection, ticker, onBackClick }: Readonly<HeaderProps>) {
  // TODO reduce duplication - can this be shared with SelectAssetFlow

  const { t } = useTranslation();

  return (
    <HeaderContainer>
      <NavigateBackButton hidden={false} onClick={onBackClick} />{" "}
      {/* TODO work out how this back can interact with SelectAssetFlow too */}
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
            key={"SELECT_ACCOUNT"}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={ANIMATION_VARIANTS}
            custom={navDirection}
            data-testid="select-asset-drawer-title-dynamic"
          >
            a {ticker} account {/* TODO translate this + work out 'a' vs 'an' */}
          </motion.span>
        </AnimatePresence>
      </Text>
    </HeaderContainer>
  );
}
