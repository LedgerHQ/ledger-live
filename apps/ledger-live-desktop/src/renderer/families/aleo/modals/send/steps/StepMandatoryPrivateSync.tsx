import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import type { StepProps } from "~/renderer/modals/Send/types";
import { useAleoPrivateSync } from "../../../hooks/useAleoPrivateSync";

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

const StepMandatoryPrivateSync = ({ transitionTo, account, updateAccount }: StepProps) => {
  const { t } = useTranslation();
  const {
    progress,
    isSyncing,
    error: privateSyncError,
  } = useAleoPrivateSync({
    account,
    autoStart: true,
    onAccountUpdated: updateAccount,
  });

  useEffect(() => {
    if (progress < 100 || isSyncing) return;
    const timer = setTimeout(() => transitionTo("record-picker"), 500);
    return () => clearTimeout(timer);
  }, [progress, isSyncing, transitionTo]);

  if (privateSyncError) {
    return (
      <Box alignItems="center" justifyContent="center" p={4} style={{ minHeight: 120 }}>
        <TitleText>{t("aleo.send.mandatoryPrivateSync.error")}</TitleText>
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
