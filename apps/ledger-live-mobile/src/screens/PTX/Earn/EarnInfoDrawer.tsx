import React, { useEffect } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

import { Track } from "../../../analytics";
import QueuedDrawer from "../../../components/QueuedDrawer";
import { useRootDrawerContext } from "../../../context/RootDrawerContext";

export function EarnInfoDrawer() {
  const { t } = useTranslation();
  const { isOpen, onModalHide, openDrawer, onClose, drawer } = useRootDrawerContext();
  const ptxEarnFeatureFlag = useFeature("ptxEarn");

  useEffect(() => {
    if (ptxEarnFeatureFlag?.enabled) {
      openDrawer();
    }
  }, [ptxEarnFeatureFlag?.enabled, openDrawer]);

  if (drawer.id !== "EarnInfoDrawer") return null;

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} onModalHide={onModalHide}>
      <Flex rowGap={52}>
        <Track onMount event="Earn Info Modal" />
        <Flex rowGap={56}>
          <Flex rowGap={16}>
            <Text variant="h4" fontFamily="Inter" textAlign="center" fontWeight="bold">
              {drawer.props.messageTitle}
            </Text>
            <Text variant="body" lineHeight="21px" color="neutral.c70" textAlign="center">
              {drawer.props.message}
            </Text>
          </Flex>
        </Flex>
        <Button onPress={() => onClose()} type="main">
          {t("common.close")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}
