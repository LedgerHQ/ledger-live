import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { BottomDrawer, Button, Flex, Icons, Text } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";

import { urls } from "../../config/urls";
import { track, TrackScreen } from "../../analytics";

type Props = {
  isOpened: boolean;
  onClose: () => void;
};

const DRAWER = "Notification Center Status";

export default function StatusCenter({ onClose, isOpened }: Props) {
  const { t } = useTranslation();
  const { incidents } = useFilteredServiceStatus();

  const { colors } = useTheme();

  const openSupportLink = useCallback(() => {
    track("url_clicked", {
      name: "Help center",
      url: urls.supportPage,
      drawer: DRAWER,
    });
    Linking.openURL(urls.supportPage);
  }, []);

  const onPressClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      drawer: DRAWER,
    });
    onClose();
  }, [onClose]);

  const onPressOk = useCallback(() => {
    track("button_clicked", {
      button: "Got it",
      drawer: DRAWER,
    });
    onClose();
  }, [onClose]);

  return (
    <BottomDrawer
      title={t("notificationCenter.status.title", {
        count: incidents.length,
      })}
      isOpen={isOpened}
      onClose={onPressClose}
      Icon={
        <Flex
          backgroundColor={colors.background.main}
          borderRadius={50}
          width={65}
          height={65}
          alignItems="center"
          justifyContent="center"
        >
          <Icons.WarningSolidMedium color={colors.warning.c70} size={40} />
        </Flex>
      }
    >
      <TrackScreen category={DRAWER} type="drawer" refreshSource={false} />

      {new Array(incidents.length).fill(null).map((_e, index) => (
        <Text
          variant="body"
          fontWeight="medium"
          color="neutral.c90"
          key={index}
          mb={3}
        >
          {`\u2022 ${incidents[index].incident_updates}`}
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

      <Button type="main" size="large" onPress={onPressOk} mt={8} mb={4}>
        {t("notificationCenter.status.cta.ok")}
      </Button>
    </BottomDrawer>
  );
}

const Link = styled(Text)`
  color: ${p => p.theme.colors.neutral.c70};
  text-decoration: underline;
  text-decoration-color: ${p => p.theme.colors.neutral.c70};
`;
