import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import SettingsRow from "../../../components/SettingsRow";
import { useLocale } from "../../../context/Locale";
import { DateFormatDrawer } from "./DateFormatDrawer";
import { track } from "../../../analytics";
import { ScreenName } from "../../../const";

const DateFormatRow = () => {
  const [isOpen, setModalOpen] = useState<boolean>(false);
  const { locale } = useLocale();

  const onClick = useCallback(() => {
    track("button_clicked", {
      button: "Date format",
      screen: ScreenName.SettingsScreen,
    });
    setModalOpen(true);
  }, []);

  const onClose = useCallback(() => {
    // ADD ANALYTICS
    track("button_clicked", {
      button: "Close",
      drawer: "Failed Stax hardware check",
    });
    setModalOpen(false);
  }, []);

  const { t } = useTranslation();

  return (
    <>
      <SettingsRow
        event="DateFormatSettingsRow"
        title={t("settings.display.dateFormat")}
        desc={t("settings.display.dateFormatDesc")}
        arrowRight
        onPress={onClick}
        testID="data-format-button"
      >
        <Text variant={"body"} fontWeight={"medium"} color="primary.c80">
          {/* {languages[locale] || locale} */}
          DD/MM/YYYY
        </Text>
      </SettingsRow>

      <DateFormatDrawer isOpen={isOpen} onCloseModal={onClose} />
    </>
  );
};

export default DateFormatRow;
