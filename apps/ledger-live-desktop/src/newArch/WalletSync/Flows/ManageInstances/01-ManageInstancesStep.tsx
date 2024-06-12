import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { AnalyticsPage, useWalletSyncAnalytics } from "../../useWalletSyncAnalytics";
import TrackPage from "~/renderer/analytics/TrackPage";
import { TinyCard } from "../../components/TinyCard";
import { Instance } from "~/renderer/reducers/walletSync";

type Props = {
  instances: Instance[];
  goToDeleteInstance: (instance: Instance) => void;
};

export default function ManageInstancesStep({ goToDeleteInstance, instances }: Props) {
  const { t } = useTranslation();

  const { onClickTrack } = useWalletSyncAnalytics();

  const handleGoDeleteInstance = (instance: Instance) => {
    onClickTrack({ button: "remove instance", page: AnalyticsPage.ManageInstances });
    goToDeleteInstance(instance);
  };

  return (
    <Flex flexDirection="column" rowGap="24px" paddingX="40px">
      <TrackPage category={AnalyticsPage.ManageInstances} />
      <Text fontSize={23} variant="large" color="neutral.c100">
        {t("walletSync.manageInstances.title")}
      </Text>

      {instances.map(instance => (
        <TinyCard
          key={instance.id}
          testId={`walletSync-manage-instance-${instance.id}`}
          text={instance.name}
          cta={t("walletSync.manageInstances.remove")}
          onClick={() => handleGoDeleteInstance(instance)}
        />
      ))}
    </Flex>
  );
}
