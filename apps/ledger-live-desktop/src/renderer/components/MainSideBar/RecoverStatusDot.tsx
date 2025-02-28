import React, { useCallback, useEffect, useState } from "react";
import { Dot } from "~/renderer/components/Dot";
import { colors } from "~/renderer/styles/theme";
import { getStoreValue } from "~/renderer/store";
import { LedgerRecoverSubscriptionStateInProgressEnum } from "~/types/recoverSubscriptionState";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

interface RecoverStatusNotificationProps {
  collapsed: boolean;
}

const RecoverStatusDot = ({ collapsed }: RecoverStatusNotificationProps) => {
  const recoverServices = useFeature("protectServicesDesktop");
  const protectID = recoverServices?.params?.protectId ?? "protect-prod";
  const [displayRecoverDot, setDisplayRecoverDot] = useState<boolean>();

  const getRecoverSubscriptionState = useCallback(async () => {
    const storage = await getStoreValue("SUBSCRIPTION_STATE", protectID);
    setDisplayRecoverDot(
      Object.values(LedgerRecoverSubscriptionStateInProgressEnum).includes(
        storage as LedgerRecoverSubscriptionStateInProgressEnum,
      ),
    );
  }, [protectID]);

  useEffect(() => {
    getRecoverSubscriptionState();
  }, [getRecoverSubscriptionState]);

  return displayRecoverDot ? <Dot collapsed={collapsed} color={colors.orange} /> : null;
};

export default RecoverStatusDot;
