import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { openURL } from "~/renderer/linking";
import CoinWallet from "~/renderer/icons/CoinWallet";
import Check from "~/renderer/icons/CheckFull";
import TrackPage from "~/renderer/analytics/TrackPage";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { StepProps } from "../types";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
const Row = styled(Box).attrs(p => ({
  horizontal: true,
  justifyContent: "flex-start",
  alignItems: "center",
  color: p.theme.colors.greenPill,
}))`
  margin-bottom: 6px;

  & > :first-child {
    margin-right: 8px;
  }
`;
const StepStarter = ({ transitionTo, t, openedWithAccount, eventType }: StepProps) => {
  const onClick = useCallback(() => {
    if (openedWithAccount) transitionTo("summary");
    else transitionTo("account");
  }, [transitionTo, openedWithAccount]);
  const stakingUrl = useLocalizedUrl(urls.stakingTezos);
  return (
    <Box flow={4} mx={4}>
      <TrackPage
        category={`Delegation Flow`}
        name="Step Starter"
        flow="stake"
        action="delegation"
        currency="xtz"
        page={`Step Starter ${eventType ? `(${eventType})` : ""}`}
        type="modal"
      />
      <Box flow={1} alignItems="center">
        <Box mb={4}>
          <CoinWallet size={120} />
        </Box>
        <Box mb={4}>
          <Text
            data-testid="delegation-starter-infos"
            ff="Inter|Regular"
            fontSize={14}
            textAlign="center"
            color="palette.text.shade80"
            style={{
              lineHeight: 1.57,
            }}
          >
            <Trans i18nKey="delegation.flow.steps.starter.description" />
          </Text>
        </Box>
        <Box>
          <Row>
            <Check size={16} />
            <Text
              ff="Inter|Bold"
              style={{
                lineHeight: 1.57,
              }}
              color="palette.text.shade100"
              fontSize={14}
            >
              <Trans i18nKey="delegation.flow.steps.starter.bullet.delegate" />
            </Text>
          </Row>
          <Row>
            <Check size={16} />
            <Text
              ff="Inter|Bold"
              style={{
                lineHeight: 1.57,
              }}
              color="palette.text.shade100"
              fontSize={14}
            >
              <Trans i18nKey="delegation.flow.steps.starter.bullet.access" />
            </Text>
          </Row>
          <Row>
            <Check size={16} />
            <Text
              ff="Inter|Bold"
              style={{
                lineHeight: 1.57,
              }}
              color="palette.text.shade100"
              fontSize={14}
            >
              <Trans i18nKey="delegation.flow.steps.starter.bullet.ledger" />
            </Text>
          </Row>
        </Box>
        <Box my={4}>
          <LinkWithExternalIcon
            label={t("delegation.howItWorks")}
            onClick={() => openURL(stakingUrl)}
          />
        </Box>
        <Button id={"delegate-starter-continue-button"} onClick={onClick} primary>
          <Trans i18nKey="delegation.flow.steps.starter.button.cta" />
        </Button>
      </Box>
    </Box>
  );
};
export default StepStarter;
