import styled from "styled-components";
import TriangleWarning from "~/renderer/icons/TriangleWarning";
import React from "react";
import { openURL } from "~/renderer/linking";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { Incident } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/types";
import Text from "~/renderer/components/Text";
import SuccessAnimatedIcon from "~/renderer/components/SuccessAnimatedIcon";
import { Trans } from "react-i18next";
import { FakeLink } from "~/renderer/components/Link";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import { urls } from "~/config/urls";
import TrackPage from "~/renderer/analytics/TrackPage";

const IncidentContainer = styled(Box)`
  width: 100%;
  display: flex;
  flex-direction: row;
  border-radius: 4px;
  border: 1px solid ${p => p.theme.colors.palette.text.shade10};
  padding: 16px;
  margin: 6px;
`;

const IncidentRightColumnContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const IncidentLeftColumnContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const IncidentIconContainer = styled(Box)`
  padding-right: 14.5px;
`;

type IncidentProps = {
  incidentData: Incident;
};
function IncidentArticle({ incidentData }: IncidentProps) {
  const { name, incident_updates: incidentUpdates, shortlink } = incidentData;
  return (
    <IncidentContainer>
      <IncidentLeftColumnContainer>
        <IncidentIconContainer color="warning">
          <TriangleWarning size={15} />
        </IncidentIconContainer>
      </IncidentLeftColumnContainer>
      <IncidentRightColumnContainer>
        <Text ff="Inter|SemiBold" fontSize="14px" lineHeight="16.94px">
          {name}
        </Text>
        {incidentUpdates
          ? incidentUpdates.map(({ body }, index) => (
              <Text
                key={index}
                mt="4px"
                ff="Inter|Medium"
                fontSize="12px"
                lineHeight="18px"
                color="palette.text.shade50"
              >
                {body}
              </Text>
            ))
          : null}
        <LinkWithExternalIcon
          onClick={shortlink ? () => openURL(shortlink) : undefined}
          style={{
            marginTop: 15,
          }}
        >
          <Trans i18nKey="informationCenter.serviceStatus.statusNotOk.learnMore" />
        </LinkWithExternalIcon>
      </IncidentRightColumnContainer>
    </IncidentContainer>
  );
}
function StatusOkHeader() {
  return (
    <>
      <SuccessAnimatedIcon height={64} width={64} />
      <Text
        mt="22px"
        color="palette.text.shade100"
        ff="Inter|SemiBold"
        fontSize="18px"
        lineHeight="21.78px"
        textAlign="center"
      >
        <Trans i18nKey="informationCenter.serviceStatus.statusOk.title" />
      </Text>
      <Text
        mt="8px"
        color="palette.text.shade50"
        ff="Inter|Regular"
        fontSize="13px"
        lineHeight="16px"
        textAlign="center"
      >
        <Trans i18nKey="informationCenter.serviceStatus.statusOk.description">
          <FakeLink onClick={() => openURL(urls.ledgerStatus)} />
        </Trans>
      </Text>
    </>
  );
}
function StatusNotOkHeader({ incidents }: { incidents: Incident[] }) {
  return (
    <ScrollArea hideScrollbar>
      <Box py="32px" alignItems="center">
        <Box color="warning">
          <TriangleWarning size={54} />
        </Box>
        <Text
          mt="22px"
          mb="42px"
          color="palette.text.shade100"
          ff="Inter|SemiBold"
          fontSize="18px"
          lineHeight="21.78px"
        >
          <Trans i18nKey="informationCenter.serviceStatus.statusNotOk.title" />
        </Text>
        {incidents.map(incidentData => (
          <IncidentArticle key={incidentData.id} incidentData={incidentData} />
        ))}
      </Box>
    </ScrollArea>
  );
}
const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
`;
export function ServiceStatusPanel() {
  const { incidents } = useFilteredServiceStatus();
  console.log({
    incidents,
  });
  return (
    <PanelContainer>
      <TrackPage category="Notification Center" name="notification_center_status" />
      {incidents.length > 0 ? <StatusNotOkHeader incidents={incidents} /> : <StatusOkHeader />}
    </PanelContainer>
  );
}
