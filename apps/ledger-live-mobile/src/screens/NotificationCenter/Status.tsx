import React, { useCallback } from "react";
import { Linking, FlatList } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { Incident } from "@ledgerhq/live-common/notifications/AnnouncementProvider/types";
import { Alert, Flex, IconBox, Notification, Text } from "@ledgerhq/native-ui";
import { CheckAloneMedium } from "@ledgerhq/native-ui/assets/icons";
import styled, { useTheme } from "styled-components/native";
import { urls } from "../../config/urls";

type Props = {
  item: Incident;
  index: number;
};

const MainContainer = styled.SafeAreaView`
  background-color: ${p => p.theme.colors.palette.background.main};
  padding: ${p => p.theme.space[6]}px;
  flex: 1;
`;

const BorderedIncidentContainer = styled.View`
  border: 1px solid ${p => p.theme.colors.palette.neutral.c40};
  padding: ${p => p.theme.space[5]}px;
  margin-bottom: ${p => p.theme.space[5]}px;

  border-radius: 4px;
`;

const IncidentRow = ({ item }: Props) => {
  const { t } = useTranslation();
  const { incident_updates: incidentUpdates, name, shortlink } = item;

  // Todo: Track back StatusLearnMore click event
  return (
    <BorderedIncidentContainer>
      <Notification
        variant={"secondary"}
        title={name}
        subtitle={
          incidentUpdates && incidentUpdates.length
            ? incidentUpdates.map(({ body }) => body).join("\n")
            : ""
        }
        {...(!!shortlink && {
          linkText: t("common.learnMore"),
          onLinkPress: () => Linking.openURL(shortlink),
        })}
      />
    </BorderedIncidentContainer>
  );
};

export default function NotificationCenter() {
  const { t } = useTranslation();
  const { incidents } = useFilteredServiceStatus();
  const { colors } = useTheme();

  const onHelpPageRedirect = useCallback(() => {
    Linking.openURL(urls.ledgerStatus); // @TODO redirect to correct url
  }, []);

  return (
    <MainContainer>
      {incidents.length > 0 ? (
        <Alert
          type={"warning"}
          title={t("notificationCenter.status.error.title")}
        />
      ) : (
        <Flex flex={1} alignItems={"center"} justifyContent={"flex-end"}>
          <IconBox Icon={CheckAloneMedium} color={colors.palette.success.c80} />
          <Text variant={"h3"} color={"palette.neutral.c100"} marginTop={6}>
            <Trans i18nKey="notificationCenter.status.ok.title" />
          </Text>
          <Text variant={"paragraph"} color="palette.neutral.c80">
            <Trans i18nKey="notificationCenter.status.ok.desc">
              <Text variant={"paragraph"} color="palette.neutral.c80">
                {""}
              </Text>
              <Text
                variant={"paragraph"}
                color="palette.neutral.c100"
                style={{ textDecorationLine: "underline" }}
                onPress={onHelpPageRedirect}
              >
                {""}
              </Text>
            </Trans>
          </Text>
        </Flex>
      )}
      <FlatList
        contentContainerStyle={{ marginTop: 20 }}
        style={{ flex: 1 }}
        data={incidents}
        renderItem={props => <IncidentRow {...props} />}
        keyExtractor={(item, index) => item.id + index}
      />
    </MainContainer>
  );
}
