import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import { ErrorBody } from "~/renderer/components/ErrorBody";
import { Flex, IconsLegacy, InfiniteLoader } from "@ledgerhq/react-ui";
import type { StepProps } from "~/renderer/modals/Send/types";
import { useAleoPrivateSync } from "../../../hooks/useAleoPrivateSync";
import { getAleoCurrencyConfig } from "../../../shared/utils";

const TitleText = styled.p`
  font-size: 20px;
  color: ${p => p.theme.colors.neutral.c100};
  font-weight: 600;
  margin-bottom: 8px;
`;

const DescText = styled.p`
  font-size: 12px;
  color: ${p => p.theme.colors.neutral.c70};
  font-weight: 400;
`;

const ErrorIcon = ({ size }: { size?: number }) => (
  <IconsLegacy.WarningMedium size={size} color="error.c60" />
);

const StepMandatoryPrivateSync = ({
  transitionTo,
  account,
  parentAccount,
  updateAccount,
}: StepProps) => {
  const { t } = useTranslation();
  const mainAccount = account ? getMainAccount(account, parentAccount ?? undefined) : null;
  const config = mainAccount ? getAleoCurrencyConfig(mainAccount.currency) : undefined;
  const nextStep =
    !config || config.recordPickingStrategy === "manual" ? "record-picker" : "amount";

  const {
    progress,
    isSyncing,
    error: privateSyncError,
    start,
  } = useAleoPrivateSync({
    account: mainAccount,
    autoStart: true,
    onAccountUpdated: updateAccount,
  });

  useEffect(() => {
    if (progress < 100 || isSyncing) return;
    const timer = setTimeout(() => transitionTo(nextStep), 500);
    return () => clearTimeout(timer);
  }, [progress, isSyncing, transitionTo, nextStep]);

  if (privateSyncError) {
    return (
      <Box alignItems="center" justifyContent="center" p={4} style={{ minHeight: 120 }}>
        <ErrorBody
          Icon={ErrorIcon}
          title={t("aleo.send.mandatoryPrivateSync.errorTitle")}
          description={t("aleo.send.mandatoryPrivateSync.errorDesc")}
          buttons={
            <Button primary px="20px" py="10px" onClick={start}>
              {t("common.retry")}
            </Button>
          }
        />
      </Box>
    );
  }

  return (
    <Flex
      alignItems="center"
      flexDirection="column"
      columnGap="20px"
      justifyContent="center"
      p={4}
      minHeight={240}
    >
      <Flex alignItems="center" justifyContent="center" borderRadius={9999} size={60} mb={5}>
        <InfiniteLoader size={58} />
      </Flex>
      <TitleText>{t("aleo.send.mandatoryPrivateSync.title", { percentage: progress })}</TitleText>
      <DescText>{t("aleo.send.mandatoryPrivateSync.desc")}</DescText>
    </Flex>
  );
};

export default StepMandatoryPrivateSync;
