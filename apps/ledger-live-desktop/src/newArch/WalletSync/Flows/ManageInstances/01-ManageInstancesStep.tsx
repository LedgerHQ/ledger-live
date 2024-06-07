import { Flex, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { AnalyticsPage, useWalletSyncAnalytics } from "../../useWalletSyncAnalytics";
import TrackPage from "~/renderer/analytics/TrackPage";
import { TinyCard } from "../../components/TinyCard";

type Props = {
  goToDeleteInstance: () => void;
};

export default function ManageInstancesStep({ goToDeleteInstance }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const INSTANCES = [
    {
      name: "Iphone 13",
      id: "1",
    },
    {
      name: "Iphone 8",
      id: "2",
    },
    {
      name: "macOS",
      id: "3",
    },
    {
      name: "Samsung Galaxy S21",
      id: "4",
    },
  ];

  const { onClickTrack } = useWalletSyncAnalytics();

  const handleGoDeleteInstance = () => {
    onClickTrack({ button: "remove instance", page: AnalyticsPage.ManageInstances });
    goToDeleteInstance();
  };

  return (
    <Flex flexDirection="column" rowGap="24px">
      <TrackPage category={AnalyticsPage.ManageInstances} />
      <Text fontSize={23} variant="large" color="neutral.c100">
        {t("walletSync.manageInstances.title")}
      </Text>

      {INSTANCES.map(({ name, id }) => (
        <TinyCard
          key={id}
          testId={`walletSync-manage-instance-${id}`}
          text={name}
          cta={t("walletSync.manageInstances.remove")}
          onClick={handleGoDeleteInstance}
        />
      ))}
    </Flex>
  );
}
