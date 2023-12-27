import React from "react";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { Box, Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";

import { Incident } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/types";

import { FlatList } from "react-native";
import { TrackScreen } from "~/analytics";
import SettingsNavigationScrollView from "../Settings/SettingsNavigationScrollView";

const DATA_TRACKING_DRAWER_NAME = "Notification Center Status";
const Container = styled(SettingsNavigationScrollView)``;
const IncidentBox = styled(Flex)``;

export default function StatusCenter() {
  const { incidents } = useFilteredServiceStatus();
  const { colors, space } = useTheme();

  const ListItem = (incident: Incident) => {
    return (
      <IncidentBox flexDirection="row" px={7} justifyContent="center">
        <Box mr={3} pt={1}>
          <IconsLegacy.WarningSolidMedium
            color={incident.impact === "critical" ? colors.error.c60 : colors.warning.c70}
            size={14}
          />
        </Box>
        <Flex flexDirection="column" justifyContent="space-between">
          <Text variant="body" fontWeight="medium" color="neutral.c100" mb={3}>
            {incident.name}
          </Text>
          {incident.incident_updates?.length && (
            <Text variant="body" fontWeight="medium" color="neutral.c70">
              {incident.incident_updates[0].body}
            </Text>
          )}
        </Flex>
      </IncidentBox>
    );
  };

  return (
    <Container>
      <TrackScreen category={DATA_TRACKING_DRAWER_NAME} type="page" refreshSource={false} />
      <FlatList
        data={incidents}
        contentContainerStyle={{
          flex: 1,
        }}
        keyExtractor={(incident: Incident) => incident.id}
        renderItem={elem => ListItem(elem.item)}
        ItemSeparatorComponent={() => <Box height={space[7]} />}
      />
    </Container>
  );
}
