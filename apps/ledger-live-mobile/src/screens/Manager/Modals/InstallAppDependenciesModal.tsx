import React, { memo } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Flex, IconsLegacy, Text, Button } from "@ledgerhq/native-ui";
import AppIcon from "../AppsList/AppIcon";
import QueuedDrawer from "~/components/QueuedDrawer";
import { AppWithDependencies } from "../AppsInstallUninstallWithDependenciesContext";
import Link from "~/components/wrappedUi/Link";

type Props = {
  appWithDependenciesToInstall: AppWithDependencies | null;
  onClose: () => void;
  installAppWithDependencies: () => void;
};

const IconContainer = styled(Flex).attrs({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
})``;

const LinkIconContainer = styled(Flex).attrs({
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
})``;

const TextContainer = styled(Flex).attrs({
  marginTop: "24px",
  marginBottom: "32px",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
})``;

const ModalText = styled(Text).attrs({
  textAlign: "center",
})``;

const SeparatorText = styled(Text).attrs({
  marginHorizontal: 6,
})``;

const ButtonsContainer = styled(Flex).attrs({
  width: "100%",
})``;

function InstallAppDependenciesModal({
  appWithDependenciesToInstall,
  onClose,
  installAppWithDependencies,
}: Props) {
  const { app, dependencies = [] } = appWithDependenciesToInstall || {};
  const { name } = app || {};

  return (
    <QueuedDrawer isRequestingToBeOpened={!!app} onClose={onClose}>
      <Flex alignItems="center">
        {!!dependencies.length && (
          <>
            <IconContainer>
              <AppIcon app={app} size={40} />
              <SeparatorText color="neutral.c40">- - -</SeparatorText>
              <LinkIconContainer backgroundColor="neutral.c30">
                <IconsLegacy.LinkMedium size={16} color="neutral.c80" />
              </LinkIconContainer>
              <SeparatorText color="neutral.c40">- - -</SeparatorText>
              <AppIcon app={dependencies[0]} size={40} />
            </IconContainer>
            <TextContainer>
              <ModalText color="neutral.c100" fontWeight="medium" variant="h2">
                <Trans
                  i18nKey="AppAction.install.dependency.title"
                  values={{ dependency: dependencies[0].name }}
                />
              </ModalText>
              <ModalText
                marginTop="16px"
                color="neutral.c70"
                fontWeight="medium"
                variant="bodyLineHeight"
              >
                <Trans
                  i18nKey="AppAction.install.dependency.description_one"
                  values={{ dependency: dependencies[0].name, app: name }}
                />
              </ModalText>
            </TextContainer>
            <ButtonsContainer>
              <Button size="large" type="main" mb={7} onPress={installAppWithDependencies}>
                <Trans i18nKey="AppAction.install.continueInstall" />
              </Button>
              <Link size="large" onPress={onClose}>
                <Trans i18nKey="common.cancel" />
              </Link>
            </ButtonsContainer>
          </>
        )}
      </Flex>
    </QueuedDrawer>
  );
}

export default memo(InstallAppDependenciesModal);
