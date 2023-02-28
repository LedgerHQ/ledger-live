import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { InfoMedium } from "@ledgerhq/native-ui/assets/icons";
import { useCleanCache } from "../../../actions/general";
import SettingsRow from "../../../components/SettingsRow";
import { useReboot } from "../../../context/Reboot";
import Button from "../../../components/wrappedUi/Button";
import QueuedDrawer from "../../../components/QueuedDrawer";

export default function ClearCacheRow() {
  const { t } = useTranslation();
  const cleanCache = useCleanCache();
  const reboot = useReboot();

  const [isModalOpened, setIsModalOpened] = useState(false);

  const onRequestClose = useCallback(() => {
    setIsModalOpened(false);
  }, []);

  const onPress = useCallback(() => {
    setIsModalOpened(true);
  }, []);

  const onClearCache = useCallback(async () => {
    await cleanCache();
    reboot();
  }, [cleanCache, reboot]);

  return (
    <>
      <SettingsRow
        event="ClearCacheRow"
        title={t("settings.help.clearCache")}
        desc={t("settings.help.clearCacheDesc")}
        onPress={onPress}
        arrowRight
      />
      <QueuedDrawer
        isRequestingToBeOpened={isModalOpened}
        onClose={onRequestClose}
        Icon={InfoMedium}
        iconColor={"primary.c80"}
        title={t("settings.help.clearCache")}
        description={t("settings.help.clearCacheModalDesc")}
      >
        <Button
          type={"main"}
          mt={4}
          onPress={onClearCache}
          event="DoClearCache"
        >
          {t("settings.help.clearCacheButton")}
        </Button>
        <Button
          type={"default"}
          mt={4}
          onPress={onRequestClose}
          event="CancelClearCache"
        >
          {t("common.cancel")}
        </Button>
      </QueuedDrawer>
    </>
  );
}
