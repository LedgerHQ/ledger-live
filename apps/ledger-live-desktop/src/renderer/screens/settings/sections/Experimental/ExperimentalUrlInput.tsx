import { Flex } from "@ledgerhq/react-ui";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import ConfirmModal from "~/renderer/modals/ConfirmModal";
import { useActionModal } from "../Help/logic";
import Box from "~/renderer/components/Box";
import Alert from "~/renderer/components/Alert";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { useDB } from "~/renderer/storage";

const ExperimentalUrlInput = () => {
  const { t } = useTranslation();
  const [proxyUrl, setProxyUrl] = useDB("app", "proxy", { url: "" }, state => {
    if ("url" in state) {
      return state.url;
    }
    return "";
  });
  const [inputValue, setInputValue] = useState(proxyUrl);
  const [{ opened, pending }, { open, close, handleConfirm }] = useActionModal();

  const handleOnClick = useCallback(() => {
    setProxyUrl({ url: inputValue });
    open();
  }, [setProxyUrl, inputValue, open]);

  const onConfirm = useCallback(() => {
    if (pending) return;
    handleConfirm();
    window.api?.reloadRenderer();
  }, [handleConfirm, pending]);

  useEffect(() => {
    if (proxyUrl) {
      setInputValue(proxyUrl);
    }
  }, [proxyUrl]);

  const buttonDisabled = inputValue === proxyUrl;

  return (
    <Flex alignItems="center">
      <Input
        value={inputValue}
        onChange={setInputValue}
        onEnter={buttonDisabled ? undefined : handleOnClick}
      />
      <Button disabled={buttonDisabled} ml={4} small primary onClick={handleOnClick}>
        {t("common.apply")}
      </Button>

      <ConfirmModal
        analyticsName="RestartModal"
        isDanger
        centered
        isLoading={pending}
        isOpened={opened}
        onClose={close}
        onReject={close}
        onConfirm={onConfirm}
        confirmText={t("common.restart")}
        title={t("settings.restartLedgerLiveforProxyModal.title")}
        desc={
          <Box>
            {t("settings.restartLedgerLiveforProxyModal.desc")}
            <Alert type="hint" learnMoreUrl="https://ledger.com/blog" mt={4}></Alert>
          </Box>
        }
      >
        <SyncSkipUnderPriority priority={999} />
      </ConfirmModal>
    </Flex>
  );
};

export default ExperimentalUrlInput;
