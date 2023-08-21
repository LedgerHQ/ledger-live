import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/native-ui";

import QueuedDrawer from "../../components/QueuedDrawer";
import TextInput from "../../components/TextInput";

export type Props = {
  isOpen: boolean;
  value: string;
  onClose: () => void;
  onChange: (_: string) => void;
};

const DebugURLDrawer = ({ isOpen, value, onClose, onChange }: Props) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(value);

  const handleClose = useCallback(() => {
    onClose();
    setInputValue(value);
  }, [setInputValue, onClose, value]);

  const handleSave = useCallback(() => {
    onClose();
    onChange(inputValue);
  }, [inputValue, onClose, onChange]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      title={t("purchaseDevice.debugDrawers.url.title")}
      subtitle={t("purchaseDevice.debugDrawers.url.subtitle")}
    >
      <TextInput
        value={inputValue}
        onChangeText={setInputValue}
        numberOfLines={1}
        placeholder="https://www.ledger.com/buy"
      />
      <Button type="main" mt={4} onPress={handleSave}>
        {t("purchaseDevice.debugDrawers.url.cta")}
      </Button>
    </QueuedDrawer>
  );
};

export default DebugURLDrawer;
