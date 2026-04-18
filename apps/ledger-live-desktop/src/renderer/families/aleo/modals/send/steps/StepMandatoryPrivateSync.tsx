import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import { useSelector } from "LLD/hooks/redux";
import { accountSelector } from "~/renderer/reducers/accounts";
import type { State } from "~/renderer/reducers";
import type { StepProps } from "~/renderer/modals/Send/types";
import { isAleoAccount } from "./utils";
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

  // Record the timestamp at mount so we can detect a sync that completed during
  // this step (as opposed to a stale lastPrivateSyncDate from before the user
  // opened the send flow).
  const mountedAtRef = useRef(new Date());

  // get latest account state instead of snapshot from props
  const accountId = account?.type === "Account" ? account.id : undefined;
  const liveAccount = useSelector((state: State) =>
    accountId ? accountSelector(state, { accountId }) : undefined,
  );
  const aleoAccount = liveAccount && isAleoAccount(liveAccount) ? liveAccount : null;
  const lastPrivateSyncDate = aleoAccount?.aleoResources?.lastPrivateSyncDate ?? null;

  // Transition when a full private sync completes during this step session.
  const syncDoneForThisStep =
    lastPrivateSyncDate !== null && lastPrivateSyncDate >= mountedAtRef.current;

  const {
    progress: localProgress,
    backgroundProgress,
    error: privateSyncError,
  } = useAleoPrivateSync({
    account,
    autoStart: true,
    onAccountUpdated: updateAccount,
  });

  useEffect(() => {
    if (!syncDoneForThisStep) return;
    const timer = setTimeout(() => transitionTo("record-picker"), 500);
    return () => clearTimeout(timer);
  }, [syncDoneForThisStep, transitionTo]);

  // backgroundProgress is non-null when the background bridge sync is running
  // (and this hook is idle). Fall back to localProgress when the hook runs its own sync.
  const displayProgress = backgroundProgress ?? localProgress;

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

      <TitleText>
        {t("aleo.send.mandatoryPrivateSync.title", { percentage: displayProgress })}
      </TitleText>
      <DescText>{t("aleo.send.mandatoryPrivateSync.desc")}</DescText>
    </Flex>
  );
};

export default StepMandatoryPrivateSync;
