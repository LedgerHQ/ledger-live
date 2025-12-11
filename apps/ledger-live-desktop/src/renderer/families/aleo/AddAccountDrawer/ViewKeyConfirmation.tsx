import React from "react";
import { Trans, useTranslation } from "react-i18next";
import type { Device } from "@ledgerhq/types-devices";
import type { Account } from "@ledgerhq/types-live";
import { Alert, Text, Flex } from "@ledgerhq/react-ui/index";
import Animation from "~/renderer/animations";
import Box from "~/renderer/components/Box";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { SubTitle, Title } from "~/renderer/components/DeviceAction/rendering";
import useTheme from "~/renderer/hooks/useTheme";
import {
  ALEO_ACCOUNT_SHARING_STATUS,
  type AleoAccountSharingStatus,
} from "~/renderer/families/aleo/AddAccountDrawer/domain";
import ViewKeyConfirmationAccountRow from "~/renderer/families/aleo/AddAccountDrawer/ViewKeyConfirmationAccountRow";
import { ActionButtons } from "LLD/features/AddAccountDrawer/screens/AccountsWarning/components";

interface Props {
  device: Device;
  shared: number;
  selectedAccounts: Account[];
  confirmedAccountIds: Set<string>;
  rejectedAccountIds: Set<string>;
  onCancel: () => void;
}

const ViewKeyConfirmation = ({
  device,
  shared,
  selectedAccounts,
  confirmedAccountIds,
  rejectedAccountIds,
  onCancel,
}: Props) => {
  const { t } = useTranslation();
  const theme = useTheme().theme;

  const getAccountStatus = (index: number, accountId: string): AleoAccountSharingStatus => {
    if (index === shared) return ALEO_ACCOUNT_SHARING_STATUS.PENDING;
    if (confirmedAccountIds.has(accountId)) return ALEO_ACCOUNT_SHARING_STATUS.CONFIRMED;
    if (rejectedAccountIds.has(accountId)) return ALEO_ACCOUNT_SHARING_STATUS.REJECTED;
    return ALEO_ACCOUNT_SHARING_STATUS.WAITING;
  };

  return (
    <Flex height="100%" flexDirection="column">
      <Box height="100%" overflowY="auto" pb={120}>
        <Animation animation={getDeviceAnimation(device.modelId, theme, "verify")} />
        <DeviceBlocker />
        <Title>
          <Trans i18nKey="aleo.addAccount.stepViewKeyApprove.title" />
        </Title>
        <SubTitle mb={4}>
          <Trans i18nKey="aleo.addAccount.stepViewKeyApprove.description">
            <Text fontWeight="bold" />
          </Trans>
        </SubTitle>
        <Flex width="100%" mb={4} rowGap={2} flexDirection="column">
          {selectedAccounts.map((account, index) => (
            <ViewKeyConfirmationAccountRow
              key={account.id}
              account={account}
              status={getAccountStatus(index, account.id)}
            />
          ))}
        </Flex>
        <Alert
          type="info"
          containerProps={{ p: 20, borderRadius: 8 }}
          renderContent={() => (
            <Text fontWeight="medium" fontSize={4}>
              <Trans i18nKey="aleo.addAccount.stepViewKeyApprove.cancelAlert" />
            </Text>
          )}
        />
      </Box>
      <ActionButtons
        primaryAction={null}
        secondaryAction={{
          onClick: onCancel,
          text: t("aleo.addAccount.stepViewKeyApprove.cancelAllBtn", {
            count: selectedAccounts.length,
          }),
        }}
      />
    </Flex>
  );
};

export default ViewKeyConfirmation;
