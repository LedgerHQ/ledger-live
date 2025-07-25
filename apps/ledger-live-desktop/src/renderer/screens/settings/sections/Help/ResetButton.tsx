import React, { useCallback } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import logger from "~/renderer/logger";
import { useHardReset } from "~/renderer/reset";
import ConfirmModal from "~/renderer/modals/ConfirmModal";
import ResetFallbackModal from "~/renderer/modals/ResetFallbackModal";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Alert from "~/renderer/components/Alert";
import IconTriangleWarning from "~/renderer/icons/TriangleWarning";
import { ActionModalReducer, ActionModalState, useActionModal } from "./logic";

export default function ResetButton() {
  const { t } = useTranslation();
  const hardReset = useHardReset();
  const [state, actions] = useActionModal();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { opened, pending, fallbackOpened } = state as ActionModalState;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { open, close, closeFallback, handleConfirm, handleError } = actions as ActionModalReducer;
  const onConfirm = useCallback(async () => {
    if (pending) return;
    try {
      handleConfirm();
      await hardReset();
      window.api?.reloadRenderer();
    } catch (err) {
      logger.error(err);
      handleError();
    }
  }, [pending, handleConfirm, handleError, hardReset]);
  return (
    <>
      <Button data-testid="reset-button" small danger onClick={open} event="HardResetIntent">
        {t("common.reset")}
      </Button>

      <ConfirmModal
        analyticsName="HardReset"
        isDanger
        centered
        isLoading={pending}
        isOpened={opened}
        onClose={close}
        onReject={close}
        onConfirm={onConfirm}
        confirmText={t("common.reset")}
        title={t("settings.hardResetModal.title")}
        desc={
          <Box>
            {t("settings.hardResetModal.desc")}
            <Alert data-testid="warning-message" type="warning" mt={4}>
              {t("settings.hardResetModal.warning")}
            </Alert>
          </Box>
        }
        renderIcon={() => (
          // FIXME why not pass in directly the DOM 🤷🏻
          <IconWrapperCircle color="alertRed">
            <IconTriangleWarning width={23} height={21} />
          </IconWrapperCircle>
        )}
      >
        <SyncSkipUnderPriority priority={999} />
      </ConfirmModal>

      <ResetFallbackModal isOpened={fallbackOpened} onClose={closeFallback} />
    </>
  );
}
export const IconWrapperCircle = styled(Box)`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #ea2e4919;
  align-items: center;
  justify-content: center;
`;
