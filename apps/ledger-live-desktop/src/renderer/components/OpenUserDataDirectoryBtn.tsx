import { ipcRenderer } from "electron";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import Button, { Props as ButtonProps } from "~/renderer/components/Button";
const OpenUserDataDirectoryBtn = (props: Partial<ButtonProps>) => {
  const { t } = useTranslation();
  const handleOpenUserDataDirectory = useCallback(() => {
    ipcRenderer.invoke("openUserDataDirectory");
  }, []);
  return (
    <Button event="View user data" onClick={handleOpenUserDataDirectory} {...props}>
      {props.children || t("settings.openUserDataDirectory.btn")}
    </Button>
  );
};
export default OpenUserDataDirectoryBtn;
