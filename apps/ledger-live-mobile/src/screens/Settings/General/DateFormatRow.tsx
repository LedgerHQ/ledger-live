import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { useSelector } from "react-redux";
import SettingsRow from "../../../components/SettingsRow";
import { DateFormatDrawer } from "./DateFormatDrawer";
import { track } from "../../../analytics";
import { ScreenName } from "../../../const";
import { dateFormatSelector } from "../../../reducers/settings";
import { Format } from "../../../components/DateFormat/formatter.util";

const DateFormatRow = () => {
  const [isOpen, setModalOpen] = useState<boolean>(false);

  const dateFormat = useSelector(dateFormatSelector);

  const onClick = useCallback(() => {
    track("button_clicked", {
      button: "Date format",
      screen: ScreenName.SettingsScreen,
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const { t } = useTranslation();

  return (
    <>
      <SettingsRow
        title={t("settings.display.dateFormat")}
        desc={t("settings.display.dateFormatDesc")}
        arrowRight
        onPress={onClick}
        testID="data-format-button"
      >
        <Text variant={"body"} fontWeight={"medium"} color="primary.c80">
          {dateFormat === Format.default
            ? t("settings.display.DateFormatModal.default")
            : dateFormat}
        </Text>
      </SettingsRow>

      <DateFormatDrawer isOpen={isOpen} closeModal={closeModal} />
    </>
  );
};

export default DateFormatRow;
