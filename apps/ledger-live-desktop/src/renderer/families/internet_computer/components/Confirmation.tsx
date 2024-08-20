import React from "react";
import styled from "styled-components";
import { Box, Text, Flex } from "@ledgerhq/react-ui";
import CheckCircle from "~/renderer/icons/CheckCircle";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useTranslation } from "react-i18next";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { colors } from "~/renderer/styles/theme";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import {
  ICPAccount,
  ICPTransactionType,
} from "@ledgerhq/live-common/families/internet_computer/types";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
}))`
  width: 100%;
  justify-content: space-between;
  padding: 40px 20px;
`;

const SuccessIcon = styled(CheckCircle)`
  color: ${p => p.theme.colors.success.c100};
`;

const ActionText = styled(Text)`
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

type Props = {
  lastManageAction: ICPTransactionType;
  account: ICPAccount;
  transitionTo: (step: string) => void;
  error: Error | null;
};

export default function StepConfirmation({
  account,
  lastManageAction,
  transitionTo,
  error,
}: Props) {
  const { t } = useTranslation();
  const currencyId = account.currency.id;
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!lastManageAction || lastManageAction === "list_neurons") {
    transitionTo("listNeuron");
    return null;
  }

  return (
    <Container>
      <TrackPage
        category="Manage Neurons ICP Flow"
        name="Step Success"
        flow="manage"
        action={lastManageAction}
        currency={currencyId}
      />
      <SyncOneAccountOnMount
        reason="neuron-management-confirmation"
        priority={10}
        accountId={account.id}
      />

      <Flex flexDirection="column" alignItems="center" flex={1} justifyContent="center">
        <SuccessIcon size={64} />

        <ActionText
          style={{ fontSize: 14, fontWeight: 600 }}
          mt={6}
          mb={2}
          color={colors.positiveGreen}
        >
          {t("internetComputer.confirmation.success", {
            action: t(`internetComputer.manageNeuron.actions.${lastManageAction}`),
          })}
        </ActionText>

        <Text variant="paragraph" color="neutral.c70" textAlign="center">
          {t("internetComputer.confirmation.syncAccounts")}
        </Text>
      </Flex>
    </Container>
  );
}
