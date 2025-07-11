import React, { useState, useCallback, useRef, memo, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { Trans } from "react-i18next";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { isLiveSupportedApp } from "@ledgerhq/live-common/apps/index";
import { State } from "@ledgerhq/live-common/apps/types";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box/Box";
import FadeInOutBox from "~/renderer/components/FadeInOutBox";
import IconCross from "~/renderer/icons/Cross";
import Button from "~/renderer/components/Button";
import AccountsIllustration from "~/renderer/icons/AccountsIllustration";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const IconContainer = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  p: 4,
}))`
  position: absolute;
  top: 0;
  right: 0;

  cursor: pointer;
`;
const animLogo = keyframes`
0% {
  transform: translateY(0px);
  opacity: 0;
}
100% {
  transform: translateY(-20px);
  opacity: 1;
}
`;

const LogoContainer = styled(Box).attrs(() => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}))`
  position: absolute;
  bottom: -20px;
  left: -50px;
  transform: translateY(0px);
  opacity: 0;
  animation: ${animLogo} 0.4s 1s ease-out forwards;
  ${IconContainer} {
    width: 100%;
    max-width: 110px;
  }
`;

const Container = styled.div`
  position: relative;
`;

type Props = {
  state: State;
  addAccount: (a: CryptoCurrency) => void;
  disabled: boolean;
};

const InstallSuccessBanner = ({ state, addAccount, disabled }: Props) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [hasBeenShown, setHasBeenShown] = useState(disabled);
  const { installQueue, uninstallQueue, recentlyInstalledApps, appByName, installed } = state;
  const installedSupportedApps = useMemo(() => {
    return installQueue.length <= 0 && uninstallQueue.length <= 0
      ? recentlyInstalledApps
          .filter(appName => installed.some(({ name }) => name === appName))
          .map(appName => appByName[appName])
          .filter(isLiveSupportedApp)
      : [];
  }, [installQueue.length, uninstallQueue.length, recentlyInstalledApps, appByName, installed]);
  const onAddAccount = useCallback(() => {
    if (installedSupportedApps.length === 0) {
      return;
    }
    const app = installedSupportedApps[installedSupportedApps.length - 1];
    if (app.currencyId) {
      addAccount(getCryptoCurrencyById(app.currencyId));
      setHasBeenShown(true);
    }
  }, [addAccount, installedSupportedApps]);
  const onClose = useCallback(() => setHasBeenShown(true), []);
  const visible = !hasBeenShown && installedSupportedApps.length > 0;
  const numberOfApps = installedSupportedApps.length;
  const appNameToDisplay = numberOfApps === 1 && installedSupportedApps[0].name;
  return (
    <Container ref={cardRef}>
      <FadeInOutBox in={visible} timing={800} color="palette.primary.contrastText">
        <Box horizontal pt={2} overflow="hidden">
          <Box
            borderRadius={1}
            flex="1"
            bg="palette.primary.main"
            horizontal
            pr={6}
            pl={200}
            py={3}
            position="relative"
          >
            <IconContainer onClick={onClose}>
              <IconCross size={16} />
            </IconContainer>
            <Box flex={1} justifyContent="space-between">
              <Box mb={3}>
                <Text ff="Inter|SemiBold" fontSize={6} color="palette.primary.contrastText">
                  <Trans
                    i18nKey="manager.applist.installSuccess.title"
                    values={{
                      app: appNameToDisplay,
                    }}
                    count={numberOfApps}
                  />
                </Text>
              </Box>
              <Box horizontal>
                <Button primary inverted onClick={onAddAccount} mr={1}>
                  <Trans i18nKey="manager.applist.installSuccess.manageAccount" />
                </Button>
              </Box>
            </Box>
            <LogoContainer>
              <AccountsIllustration size={130} />
            </LogoContainer>
          </Box>
        </Box>
      </FadeInOutBox>
    </Container>
  );
};
export default memo<Props>(InstallSuccessBanner);
