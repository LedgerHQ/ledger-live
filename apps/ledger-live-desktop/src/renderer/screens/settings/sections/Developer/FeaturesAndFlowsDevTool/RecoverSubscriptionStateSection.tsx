import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider } from "@ledgerhq/lumen-ui-react";
import { Flex } from "@ledgerhq/react-ui";
import { useFeature } from "@features/platform-feature-flags";
import { removePostOnboardingActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  selectRecoverStateByProtectId,
  setDisplayBanner,
  setRecoverState,
} from "~/renderer/reducers/recoverState";
import { setStoreValue } from "~/renderer/store";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

const OPTIONS = [
  {
    value: LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
    labelKey: "settings.developer.featuresAndFlowsDevTool.recover.noSubscription",
  },
  {
    value: LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY,
    labelKey: "settings.developer.featuresAndFlowsDevTool.recover.inProgress",
  },
  {
    value: LedgerRecoverSubscriptionStateEnum.BACKUP_DONE,
    labelKey: "settings.developer.featuresAndFlowsDevTool.recover.backupDone",
  },
] as const;

export const RecoverSubscriptionStateSection = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const recoverServices = useFeature("protectServicesDesktop");
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";
  const { subscriptionState } = useSelector(selectRecoverStateByProtectId(protectId));

  const handleSelect = useCallback(
    (next: LedgerRecoverSubscriptionStateEnum) => {
      try {
        setStoreValue("SUBSCRIPTION_STATE", String(next), protectId);
        setStoreValue("DISPLAY_BANNER", "true", protectId);
      } catch {
        // Banner persistence is best-effort; Redux still reflects the new state for this session.
      }
      dispatch(setDisplayBanner({ protectId, displayBanner: true }));
      dispatch(setRecoverState({ protectId, subscriptionState: next }));
      dispatch(removePostOnboardingActionCompleted({ actionId: PostOnboardingActionId.recover }));
    },
    [dispatch, protectId],
  );

  return (
    <div className="flex flex-col gap-4">
      <span className="body-2-semi-bold text-muted">
        {t("settings.developer.featuresAndFlowsDevTool.recover.title")}
      </span>
      <Divider />
      <span className="body-3 text-muted">
        {t("settings.developer.featuresAndFlowsDevTool.recover.description")}
      </span>
      <Flex flexDirection="row" columnGap={3} mt={2}>
        {OPTIONS.map(({ value, labelKey }) => (
          <Button
            key={value}
            size="sm"
            appearance={subscriptionState === value ? "accent" : "transparent"}
            onClick={() => handleSelect(value)}
          >
            {t(labelKey)}
          </Button>
        ))}
      </Flex>
    </div>
  );
};
