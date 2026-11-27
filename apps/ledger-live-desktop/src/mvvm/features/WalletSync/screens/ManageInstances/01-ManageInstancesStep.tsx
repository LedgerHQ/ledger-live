import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { AnalyticsPage, useLedgerSyncAnalytics } from "../../hooks/useLedgerSyncAnalytics";
import { TrackScreen } from "@shared/analytics-react";
import { TinyCard } from "../../components/TinyCard";
import { useInstances } from "./useInstances";
import {
  isCurrentKeyRingMember,
  selectKeyRingSession,
  type KeyRingMember,
} from "@features/platform-key-ring";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import styled from "styled-components";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

type Props = {
  goToDeleteInstance: (instance: KeyRingMember) => void;
};

export default function ManageInstancesStep({ goToDeleteInstance }: Props) {
  const { t } = useTranslation();
  const session = useSelector(selectKeyRingSession);
  const { instances } = useInstances();

  const dispatch = useDispatch();

  const { onClickTrack } = useLedgerSyncAnalytics();

  function handleGoDeleteInstance(instance: KeyRingMember) {
    onClickTrack({ button: "remove instance", page: AnalyticsPage.ManageInstances });
    goToDeleteInstance(instance);
  }

  function handleAutoRemove() {
    dispatch(
      setFlow({
        flow: Flow.ManageInstances,
        step: Step.AutoRemoveInstance,
      }),
    );
  }

  return (
    <Flex
      flexDirection="column"
      rowGap="24px"
      paddingX="40px"
      paddingBottom="24px"
      flex={1}
      minHeight={0}
    >
      <TrackScreen category={AnalyticsPage.ManageInstances} />
      <Text fontSize={23} variant="large" color="neutral.c100">
        {t("walletSync.manageInstances.title")}
      </Text>

      <List rowGap="12px" flexDirection="column" className="scrollbar-custom">
        {instances?.map(instance => (
          <TinyCard
            key={instance.id}
            testId={`walletSync-manage-instance-${instance.name}`}
            text={instance.name}
            cta={t("walletSync.manageInstances.remove")}
            onClick={
              isCurrentKeyRingMember(session, instance.id)
                ? handleAutoRemove
                : () => handleGoDeleteInstance(instance)
            }
            currentInstance={isCurrentKeyRingMember(session, instance.id)}
          />
        ))}
      </List>
    </Flex>
  );
}

const List = styled(Flex)`
  min-height: 0;
  overflow-y: auto;
`;
