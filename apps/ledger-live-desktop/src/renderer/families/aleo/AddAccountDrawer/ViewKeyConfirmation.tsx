import React from "react";
import { Trans, useTranslation } from "react-i18next";
import type { Device } from "@ledgerhq/types-devices";
import type { Account } from "@ledgerhq/types-live";
import { Alert, Text, Flex, Button } from "@ledgerhq/react-ui";
import Animation from "~/renderer/animations";
import Box from "~/renderer/components/Box";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { SubTitle, Title } from "~/renderer/components/DeviceAction/rendering";
import useTheme from "~/renderer/hooks/useTheme";
import { ALEO_ACCOUNT_SHARING_STATUS, type AleoAccountSharingStatus } from "./domain";
import { ViewKeyConfirmationAccountRow } from "./ViewKeyConfirmationAccountRow";

interface Props {
  device: Device;
  shared: number;
  selectedAccounts: Account[];
  confirmedAccountIds: Set<string>;
  rejectedAccountIds: Set<string>;
  onCancel: () => void;
}

export function ViewKeyConfirmation({
  device,
  shared,
  selectedAccounts,
  confirmedAccountIds,
  rejectedAccountIds,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme().theme;

  const getAccountStatus = (index: number, accountId: string): AleoAccountSharingStatus => {
    if (index === shared) return ALEO_ACCOUNT_SHARING_STATUS.PENDING;
    if (confirmedAccountIds.has(accountId)) return ALEO_ACCOUNT_SHARING_STATUS.CONFIRMED;
    if (rejectedAccountIds.has(accountId)) return ALEO_ACCOUNT_SHARING_STATUS.REJECTED;
    return ALEO_ACCOUNT_SHARING_STATUS.WAITING;
  };

  return (
    <Flex height="100%" flexDirection="column" data-testid="view-key-confirmation-step">
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
      <Flex
        position="absolute"
        left={0}
        right={0}
        bottom={0}
        paddingX="16px"
        paddingBottom="40px"
        width="100%"
      >
        <Flex flexDirection="column" width="100%">
          <Button onClick={onCancel} size="large" variant="main" outline>
            {t("aleo.addAccount.stepViewKeyApprove.cancelAllBtn", {
              count: selectedAccounts.length,
            })}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
