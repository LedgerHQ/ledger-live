import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useDispatch } from "LLD/hooks/redux";
import Box from "~/renderer/components/Box";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import type { StepProps } from "~/renderer/modals/Send/types";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { isAleoAccount } from "./utils";
import { MANDATORY_SYNC_POLLING_DELAY } from "../../../constants";

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

const StepMandatoryPrivateSync = ({ transitionTo, account }: StepProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const accountRef = useRef(account);
  accountRef.current = account;

  const [privateSyncError, setPrivateSyncError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let currentSubscription: { unsubscribe(): void } | null = null;

    const runSync = () => {
      const acc = accountRef.current;
      if (!acc || acc.type !== "Account" || !isAleoAccount(acc)) return;

      let latestPercentage = 0;
      const bridge = getAccountBridge(acc);
      currentSubscription = bridge
        .sync(acc, { paginationConfig: {}, syncType: SYNC_TYPE_SHIELDED })
        .subscribe({
          next: updater => {
            if (cancelled) return;
            const currentAcc = accountRef.current;
            if (!currentAcc || currentAcc.type !== "Account" || !isAleoAccount(currentAcc)) return;
            dispatch(updateAccountWithUpdater(currentAcc.id, updater));
            const updatedAccount = updater(currentAcc);
            if (!isAleoAccount(updatedAccount)) return;
            latestPercentage =
              updatedAccount.aleoResources?.provableApi?.scannerStatus?.percentage ?? 0;
            setProgress(latestPercentage);
          },
          error: (err: Error) => {
            if (cancelled) return;
            setPrivateSyncError(err);
          },
          complete: () => {
            currentSubscription = null;
            if (!cancelled && latestPercentage < 100) {
              retryTimer = setTimeout(runSync, MANDATORY_SYNC_POLLING_DELAY);
            }
          },
        });
    };

    runSync();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      currentSubscription?.unsubscribe();
      currentSubscription = null;
    };
  }, [dispatch, account?.id]);

  useEffect(() => {
    if (progress < 100) return;
    const timer = setTimeout(() => transitionTo("record-picker"), 500);
    return () => clearTimeout(timer);
  }, [progress, transitionTo]);

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
