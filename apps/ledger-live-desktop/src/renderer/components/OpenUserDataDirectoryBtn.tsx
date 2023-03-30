import React, { useCallback } from "react";
import { shell } from "electron";
import { useTranslation } from "react-i18next";
import logger from "~/renderer/logger";
import resolveUserDataDirectory from "~/helpers/resolveUserDataDirectory";
import Button, { Props as ButtonProps } from "~/renderer/components/Button";
const OpenUserDataDirectoryBtn = (props: Partial<ButtonProps>) => {
  const { t } = useTranslation();
  const handleOpenUserDataDirectory = useCallback(() => {
    const userDataDirectory = resolveUserDataDirectory();
    logger.log(`Opening user data directory: ${userDataDirectory}`);
    shell.openPath(userDataDirectory);
  }, []);
  return (
    <Button event="View user data" onClick={handleOpenUserDataDirectory} {...props}>
      {props.children || t("settings.openUserDataDirectory.btn")}
    </Button>
  );
};
export default OpenUserDataDirectoryBtn;
