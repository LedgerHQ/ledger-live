import { EnvName } from "@ledgerhq/live-env";
import { Flex } from "@ledgerhq/react-ui";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import ConfirmModal from "~/renderer/modals/ConfirmModal";
import { useActionModal } from "../Help/logic";
import Box from "~/renderer/components/Box";
import Alert from "~/renderer/components/Alert";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
// import Track from "~/renderer/analytics/Track";

type Props = {
  name: EnvName;
  value: string;
  isDefault: boolean;
  readOnly: boolean;
  onChange: (name: EnvName, val: unknown) => void;
};

const ExperimentalUrlInput = ({ onChange, value, name }: Props) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(value);
  const [{ opened, pending }, { open, close, handleConfirm }] = useActionModal();

  const handleOnClick = useCallback(() => {
    onChange(name, inputValue);
    open();
  }, [onChange, name, inputValue, open]);

  const onConfirm = useCallback(() => {
    if (pending) return;
    handleConfirm();
    window.api?.reloadRenderer();
  }, [handleConfirm, pending]);

  const buttonDisabled = inputValue === value;

  return (
    <Flex alignItems="center">
      {/* <Track onUpdate event={checked ? `${name}Enabled` : `${name}Disabled`} /> */}
      <Input
        value={inputValue}
        onChange={setInputValue}
        onEnter={buttonDisabled ? undefined : handleOnClick}
      />
      <Button disabled={buttonDisabled} ml={4} small primary onClick={handleOnClick}>
        {t("common.apply")}
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
            <Alert type="warning" mt={4}>
              {t("settings.hardResetModal.warning")}
            </Alert>
          </Box>
        }
      >
        <SyncSkipUnderPriority priority={999} />
      </ConfirmModal>
    </Flex>
  );
};

export default ExperimentalUrlInput;
