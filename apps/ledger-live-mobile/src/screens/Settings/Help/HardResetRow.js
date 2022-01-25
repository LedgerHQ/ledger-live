/* @flow */
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { disconnect } from "@ledgerhq/live-common/lib/hw";
import { useTheme } from "@react-navigation/native";
import { knownDevicesSelector } from "../../../reducers/ble";
import { useReboot } from "../../../context/Reboot";
import SettingsRow from "../../../components/SettingsRow";
import BottomModal from "../../../components/BottomModal";
import Circle from "../../../components/Circle";
import HardResetModal from "../../../components/HardResetModal";
import Trash from "../../../icons/Trash";

export default function HardResetRow() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const reboot = useReboot();
  const knownDevices = useSelector(knownDevicesSelector);

  const [isModalOpened, setIsModalOpened] = useState(false);

  const onRequestClose = useCallback(() => {
    setIsModalOpened(false);
  }, []);

  const onPress = useCallback(() => {
    setIsModalOpened(true);
  }, []);

  const onHardReset = useCallback(async () => {
    await Promise.all(knownDevices.map(d => disconnect(d.id).catch(() => {})));
    return reboot(true);
  }, [knownDevices, reboot]);

  return (
    <>
      <SettingsRow
        event="HardResetRow"
        title={t("settings.help.hardReset")}
        titleStyle={{ color: colors.alert }}
        desc={t("settings.help.hardResetDesc")}
        iconLeft={
          <Circle bg="rgba(234,46,73,0.1)" size={32}>
            <Trash size={16} color={colors.alert} />
          </Circle>
        }
        onPress={onPress}
      />
      <BottomModal
        id="HardResetModal"
        isOpened={isModalOpened}
        onClose={onRequestClose}
      >
        <HardResetModal
          onRequestClose={onRequestClose}
          onHardReset={onHardReset}
        />
      </BottomModal>
    </>
  );
}
