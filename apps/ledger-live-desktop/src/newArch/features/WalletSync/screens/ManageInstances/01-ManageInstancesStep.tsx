import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { AnalyticsPage, useWalletSyncAnalytics } from "../../hooks/useWalletSyncAnalytics";
import TrackPage from "~/renderer/analytics/TrackPage";
import { TinyCard } from "../../components/TinyCard";
import { useInstances } from "./useInstances";
import { TrustchainMember } from "@ledgerhq/trustchain/types";
import { useDispatch, useSelector } from "react-redux";
import { memberCredentialsSelector } from "@ledgerhq/trustchain/store";
import styled from "styled-components";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

type Props = {
  goToDeleteInstance: (instance: TrustchainMember) => void;
};

export default function ManageInstancesStep({ goToDeleteInstance }: Props) {
  const { t } = useTranslation();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const { instances } = useInstances();

  const dispatch = useDispatch();

  const { onClickTrack } = useWalletSyncAnalytics();

  const handleGoDeleteInstance = (instance: TrustchainMember) => {
    onClickTrack({ button: "remove instance", page: AnalyticsPage.ManageInstances });
    goToDeleteInstance(instance);
  };

  const handleAutoRemove = () => {
    dispatch(
      setFlow({
        flow: Flow.ManageInstances,
        step: Step.AutoRemoveInstance,
      }),
    );
  };

  return (
    <Flex flexDirection="column" rowGap="24px" paddingX="40px" flex={1}>
      <TrackPage category={AnalyticsPage.ManageInstances} />
      <Text fontSize={23} variant="large" color="neutral.c100">
        {t("walletSync.manageInstances.title")}
      </Text>

      <List rowGap="12px" flexDirection="column">
        {instances?.map(instance => (
          <TinyCard
            key={instance.id}
            testId={`walletSync-manage-instance-${instance.id}`}
            text={instance.name}
            cta={t("walletSync.manageInstances.remove")}
            onClick={
              memberCredentials?.pubkey === instance.id
                ? handleAutoRemove
                : () => handleGoDeleteInstance(instance)
            }
            currentInstance={memberCredentials?.pubkey == instance.id}
          />
        ))}
      </List>
    </Flex>
  );
}

const List = styled(Flex)`
  overflow-y: auto;
  max-height: calc(100vh - 12%);
  ::-webkit-scrollbar {
    width: 0;
    height: 0;
    background: transparent;
  }
`;
