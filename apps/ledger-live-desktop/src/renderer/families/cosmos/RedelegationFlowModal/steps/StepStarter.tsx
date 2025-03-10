import invariant from "invariant";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { StepProps } from "../types";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import Rewards from "~/renderer/images/rewards.svg";
import Alert from "~/renderer/components/Alert";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import { openURL } from "~/renderer/linking";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";

const RewardImg = styled.img.attrs(() => ({
  src: Rewards,
}))`
  width: 130px;
  height: auto;
`;
export default function StepStarter({ account, transaction }: StepProps) {
  invariant(account && account.cosmosResources && transaction, "account and transaction required");
  const crypto = cryptoFactory(account.currency.id);
  return (
    <Box flow={4}>
      <TrackPage
        category="Redelegation Flow"
        name="Step Starter"
        flow="stake"
        action="redelegation"
        currency={account.currency.id}
      />
      <Box flow={1} alignItems="center">
        <Box mb={4}>
          <RewardImg />
        </Box>
        <Box mb={4}>
          <Text
            ff="Inter|SemiBold"
            fontSize={13}
            textAlign="center"
            color="palette.text.shade80"
            style={{
              lineHeight: 1.57,
            }}
          >
            <Trans
              i18nKey="cosmos.redelegation.flow.steps.starter.description"
              values={{ numberOfDays: crypto.unbondingPeriod }}
            />
          </Text>
        </Box>
        <Alert type="primary">
          <Trans i18nKey="cosmos.redelegation.flow.steps.starter.warning">
            <b></b>
          </Trans>
        </Alert>
      </Box>
    </Box>
  );
}
export function StepStarterFooter({ transitionTo, account, onClose }: StepProps) {
  invariant(account, "account required");
  const stakingUrl = useLocalizedUrl(urls.stakingCosmos);
  return (
    <>
      <LinkWithExternalIcon
        label={<Trans i18nKey="cosmos.redelegation.flow.steps.starter.howDelegationWorks" />}
        onClick={() => openURL(stakingUrl)}
      />
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button
          data-testid="modal-continue-button"
          primary
          onClick={() => transitionTo("validators")}
        >
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}
