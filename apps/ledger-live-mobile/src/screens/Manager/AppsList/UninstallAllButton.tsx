import React, { memo, useState, useCallback } from "react";
import { Trans } from "react-i18next";

import { Button } from "@ledgerhq/native-ui";
import UninstallAllModal from "../Modals/UninstallAllModal";

type Props = {
  onUninstallAll: () => void;
};

const UninstallAllButton = ({ onUninstallAll }: Props) => {
  const [isOpened, setIsOpened] = useState(false);
  const openModal = useCallback(() => setIsOpened(true), [setIsOpened]);
  const closeModal = useCallback(() => setIsOpened(false), [setIsOpened]);
  const onConfirm = useCallback(() => {
    onUninstallAll();
    setIsOpened(false);
  }, [onUninstallAll, setIsOpened]);

  return (
    <>
      <Button size="small" type="error" outline onPress={openModal}>
        <Trans i18nKey="manager.uninstall.title" />
      </Button>
      <UninstallAllModal
        isOpened={isOpened}
        onClose={closeModal}
        onConfirm={onConfirm}
      />
    </>
  );
};

export default memo(UninstallAllButton);
