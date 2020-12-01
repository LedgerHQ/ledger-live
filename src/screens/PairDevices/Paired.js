// @flow

import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import { TrackScreen } from "../../analytics";
import colors from "../../colors";
import { ScreenName } from "../../const";
import LText from "../../components/LText";
import InfoIcon from "../../components/InfoIcon";
import Check from "../../icons/Check";
import Button from "../../components/Button";
import DeviceItemSummary from "../../components/DeviceItemSummary";
import NanoX from "../../icons/NanoX";
import { deviceNameByDeviceIdSelectorCreator } from "../../reducers/ble";

type Props = {
  deviceId: string,
  deviceName: string,
  onContinue: (deviceId: string) => void,
  genuine: boolean,
};

export default function Paired({
  deviceId,
  deviceName,
  onContinue: onContinuewProps,
  genuine,
}: Props) {
  const navigation = useNavigation();
  const name = useSelector(deviceNameByDeviceIdSelectorCreator(deviceId));

  const onEdit = useCallback(() => {
    navigation.navigate(ScreenName.EditDeviceName, {
      deviceId,
      deviceName: name || deviceName,
    });
  }, [navigation, deviceId, deviceName, name]);

  const onContinue = useCallback(() => {
    onContinuewProps(deviceId);
  }, [onContinuewProps, deviceId]);

  return (
    <View style={styles.root}>
      <TrackScreen category="PairDevices" name="Paired" />
      <View style={styles.container}>
        <InfoIcon
          bg={colors.pillActiveBackground}
          floatingIcon={<Check color={colors.white} size={16} />}
          floatingBg={colors.green}
        >
          <NanoX size={48} color={colors.live} />
        </InfoIcon>
        <LText secondary semiBold style={styles.title}>
          <Trans
            i18nKey="PairDevices.Paired.title"
            values={getDeviceModel("nanoX")}
          />
        </LText>
        <LText style={styles.description}>
          <Trans
            i18nKey="PairDevices.Paired.desc"
            values={getDeviceModel("nanoX")}
          />
        </LText>
        <View style={styles.fullContainer}>
          <DeviceItemSummary
            deviceId={deviceId}
            genuine={genuine}
            onEdit={onEdit}
          />
        </View>
      </View>
      <View style={styles.fullContainer}>
        <Button
          event="PairDevicesContinue"
          type="primary"
          title={<Trans i18nKey="PairDevices.Paired.action" />}
          onPress={onContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullContainer: {
    width: "100%",
  },
  title: {
    marginTop: 32,
    fontSize: 18,
    color: colors.darkBlue,
  },
  description: {
    marginTop: 16,
    marginBottom: 40,
    textAlign: "center",
    paddingHorizontal: 40,
    color: colors.smoke,
  },
});
