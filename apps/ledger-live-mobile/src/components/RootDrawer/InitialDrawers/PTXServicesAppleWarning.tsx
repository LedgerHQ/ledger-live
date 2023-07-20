import React, { useCallback, useEffect, useMemo, useState } from "react";
import QueuedDrawer from "../../QueuedDrawer";
import { useRootDrawerContext } from "../../../context/RootDrawerContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { InitialDrawerID } from "../types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Button, Checkbox, Flex, Icons, Link, Text } from "@ledgerhq/native-ui";
import { View } from "react-native";
import styled from "styled-components/native";
import { Trans, useTranslation } from "react-i18next";

const CheckboxContainer = styled(View)(
  ({ theme }) => `
  padding: ${theme.space[4]}px ${theme.space[5]}px;
  background-color: ${theme.colors.neutral.c30};
  border-radius: 4px;
`,
);

export function PTXServicesAppleWarning() {
  const { t } = useTranslation();
  const [persistentHide, setPersistentHide] = useState(false);
  const exchangeDrawer = useFeature<{ enabled: boolean }>("ptxServiceCtaExchangeDrawer");
  const ctaScreens = useFeature<{ enabled: boolean }>("ptxServiceCtaScreens");

  const exchangeDrawerEnabled = useMemo(() => exchangeDrawer?.enabled ?? true, [exchangeDrawer]);
  const ctaScreensEnabled = useMemo(() => ctaScreens?.enabled ?? true, [ctaScreens]);

  const { isOpen, onModalHide, openDrawer, onClose } = useRootDrawerContext();
  useEffect(() => {
    if (!(exchangeDrawerEnabled && ctaScreensEnabled)) {
      openDrawer();
    }
  }, [openDrawer, exchangeDrawerEnabled, ctaScreensEnabled]);

  const _onClose = useCallback(
    () =>
      onClose(() => {
        if (persistentHide) {
          AsyncStorage.setItem(InitialDrawerID.PTXServicesAppleDrawerKey, "true");
        }
      }),
    [persistentHide, onClose],
  );

  const onLinkPress = useCallback(() => {
    // TO-DO: find out where link should go
  }, []);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={_onClose} onModalHide={onModalHide}>
      <Flex rowGap={24}>
        <Flex rowGap={24} alignItems="center">
          <Text
            maxWidth={295}
            textAlign="center"
            fontFamily="inter"
            fontWeight="semiBold"
            fontSize="h4"
          >
            {t("notifications.ptxServices.drawer.title")}
          </Text>
          <Text color="neutral.c70" maxWidth={295} fontSize="body" textAlign="center">
            <Trans
              i18nKey="notifications.ptxServices.drawer.description"
              components={{ emphasized: <Text color="neutral.c100" fontSize="body" /> }}
            />
          </Text>
        </Flex>
        <CheckboxContainer>
          <Checkbox
            checked={persistentHide}
            label={t("notifications.ptxServices.drawer.checkboxLabel")}
            onChange={() => setPersistentHide(prev => !prev)}
          />
        </CheckboxContainer>
        <Button type="main" onPress={_onClose}>
          {t("notifications.ptxServices.drawer.cta")}
        </Button>
        <Link onPress={onLinkPress} Icon={Icons.ExternalLinkMedium}>
          {t("notifications.ptxServices.drawer.link")}
        </Link>
      </Flex>
    </QueuedDrawer>
  );
}
