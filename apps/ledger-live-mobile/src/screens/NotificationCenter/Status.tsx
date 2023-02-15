import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { Button, Flex, Icons, Text } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";

import QueuedDrawer from "../../components/QueuedDrawer";
import { urls } from "../../config/urls";
import { track, TrackScreen } from "../../analytics";

type Props = {
  isOpened: boolean;
  onClose: () => void;
};

const DATA_TRACKING_DRAWER_NAME = "Notification Center Status";

export default function StatusCenter({ onClose, isOpened }: Props) {
  const { t } = useTranslation();
  const { incidents } = useFilteredServiceStatus();
  const { colors } = useTheme();

  const openSupportLink = useCallback(() => {
    track("url_clicked", {
      name: "Help center",
      url: urls.supportPage,
      drawer: DATA_TRACKING_DRAWER_NAME,
    });
    Linking.openURL(urls.supportPage);
  }, []);

  const onPressClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      drawer: DATA_TRACKING_DRAWER_NAME,
    });
    onClose();
  }, [onClose]);

  const onPressOk = useCallback(() => {
    track("button_clicked", {
      button: "Got it",
      drawer: DATA_TRACKING_DRAWER_NAME,
    });
    onClose();
  }, [onClose]);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpened} onClose={onPressClose}>
      <TrackScreen
        category={DATA_TRACKING_DRAWER_NAME}
        type="drawer"
        refreshSource={false}
      />

      <Flex
        backgroundColor={colors.neutral.c100a005}
        borderRadius={50}
        width={64}
        height={64}
        alignItems="center"
        justifyContent="center"
        alignSelf="center"
      >
        <Icons.WarningSolidMedium color={colors.warning.c70} size={32} />
      </Flex>
      <Flex mx={7}>
        <Text variant="h4" fontWeight="semiBold" textAlign="center" my={7}>
          {t("notificationCenter.status.title", {
            count: incidents.length,
          })}
        </Text>
        {new Array(incidents.length).fill(null).map((_e, index) => (
          <Text
            variant="body"
            fontWeight="medium"
            color="neutral.c90"
            key={index}
            mb={3}
          >
            {`\u2022 ${incidents[index].name}`}
          </Text>
        ))}

        <Text
          variant="body"
          fontWeight="medium"
          color="neutral.c70"
          mt={6}
          textAlign="center"
        >
          {t("notificationCenter.status.desc.0")}
        </Text>

        <Text
          variant="body"
          fontWeight="medium"
          color="neutral.c70"
          textAlign="center"
          justifyContent="center"
          mt={3}
        >
          <Trans i18nKey="notificationCenter.status.desc.1">
            <Link onPress={openSupportLink} fontWeight="bold">
              {""}
            </Link>
          </Trans>
        </Text>
      </Flex>

      <Button type="main" size="large" onPress={onPressOk} mt={8} mb={4}>
        {t("notificationCenter.status.cta.ok")}
      </Button>
    </QueuedDrawer>
  );
}

const Link = styled(Text)`
  color: ${p => p.theme.colors.neutral.c70};
  text-decoration: underline;
  text-decoration-color: ${p => p.theme.colors.neutral.c70};
`;
