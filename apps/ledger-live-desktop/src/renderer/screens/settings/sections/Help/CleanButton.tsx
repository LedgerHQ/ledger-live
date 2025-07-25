import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import logger from "~/renderer/logger";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Button from "~/renderer/components/Button";
import ConfirmModal from "~/renderer/modals/ConfirmModal";
import ResetFallbackModal from "~/renderer/modals/ResetFallbackModal";
import { ActionModalReducer, ActionModalState, useActionModal } from "./logic";
import { useSoftReset } from "~/renderer/reset";

export default function CleanButton() {
  const { t } = useTranslation();
  const softReset = useSoftReset();
  const [state, actions] = useActionModal();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { opened, pending, fallbackOpened } = state as ActionModalState;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { open, close, closeFallback, handleConfirm, handleError } = actions as ActionModalReducer;
  const onConfirm = useCallback(async () => {
    if (pending) return;
    try {
      handleConfirm();
      await softReset();
    } catch (err) {
      logger.error(err);
      handleError();
    }
  }, [pending, softReset, handleConfirm, handleError]);
  return (
    <>
      <Button small primary onClick={open} event="ClearCacheIntent">
        {t("settings.profile.softReset")}
      </Button>

      <ConfirmModal
        analyticsName="CleanCache"
        centered
        isOpened={opened}
        onClose={close}
        onReject={close}
        onConfirm={onConfirm}
        isLoading={pending}
        title={t("settings.softResetModal.title")}
        subTitle={t("common.areYouSure")}
        desc={t("settings.softResetModal.desc")}
      >
        <SyncSkipUnderPriority priority={999} />
      </ConfirmModal>

      <ResetFallbackModal isOpened={fallbackOpened} onClose={closeFallback} />
    </>
  );
}
