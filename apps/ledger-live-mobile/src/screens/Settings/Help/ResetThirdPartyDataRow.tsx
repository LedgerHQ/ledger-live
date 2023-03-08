import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";
import Button from "../../../components/wrappedUi/Button";
import { resetSwapLoginAndKYCData } from "../../../actions/settings";
import QueuedDrawer from "../../../components/QueuedDrawer";

export default function ResetThirdPartyDataRow() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [isModalOpened, setIsModalOpened] = useState(false);
  const onPress = useCallback(() => {
    setIsModalOpened(true);
  }, []);

  const onRequestClose = useCallback(() => {
    setIsModalOpened(false);
  }, []);

  const onConfirm = useCallback(async () => {
    dispatch(resetSwapLoginAndKYCData());
    setIsModalOpened(false);
  }, [dispatch]);

  return (
    <>
      <SettingsRow
        event="ResetThirdPartyDataRow"
        title={t("settings.help.resetThirdPartyData")}
        desc={t("settings.help.resetThirdPartyDataDesc")}
        onPress={onPress}
        arrowRight
      />
      <QueuedDrawer
        isRequestingToBeOpened={isModalOpened}
        onClose={onRequestClose}
        Icon={Icons.InfoMedium}
        iconColor={"primary.c80"}
        title={t("settings.help.resetThirdPartyDataModal")}
        description={t("settings.help.resetThirdPartyDataModalDesc")}
      >
        <Button type={"main"} mt={4} onPress={onConfirm} event="DoClearCache">
          {t("common.confirm")}
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
