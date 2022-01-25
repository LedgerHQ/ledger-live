// @flow
import React, { useState, useCallback } from "react";

import { StyleSheet, Linking, Image } from "react-native";
import { Trans } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/devices";
import LText from "../../../components/LText";
import BottomModal from "../../../components/BottomModal";
import Button from "../../../components/Button";
import Alert from "../../../components/Alert";
import seedWarning from "../assets/seedWarning.png";
import { urls } from "../../../config/urls";

const SeedWarning = ({ deviceModelId }: { deviceModelId: DeviceModelId }) => {
  const deviceName = getDeviceModel(deviceModelId).productName;
  const [isOpened, setIsOpened] = useState(true);

  const onContactSupport = useCallback(() => {
    Linking.openURL(urls.contact);
  }, []);

  return (
    <BottomModal
      isOpened={isOpened}
      onClose={() => setIsOpened(false)}
      style={[styles.modal]}
    >
      <Image
        style={styles.imageSeedWarning}
        resizeMode="contain"
        source={seedWarning}
      />
      <LText style={styles.modalTitle} semiBold>
        <Trans i18nKey="onboarding.warning.seed.title" />
      </LText>
      <LText style={styles.modalDescription} color="smoke">
        <Trans i18nKey="onboarding.warning.seed.desc" values={{ deviceName }} />
      </LText>
      <Alert type="danger">
        <Trans i18nKey="onboarding.warning.seed.warning" />
      </Alert>
      <Button
        type="primary"
        testID={"Onboarding - Seed warning"}
        containerStyle={styles.button}
        onPress={() => setIsOpened(false)}
        title={<Trans i18nKey="onboarding.warning.seed.continueCTA" />}
      />
      <Button
        type="secondary"
        outline={false}
        containerStyle={styles.button}
        onPress={onContactSupport}
        title={<Trans i18nKey="onboarding.warning.seed.contactSupportCTA" />}
      />
    </BottomModal>
  );
};

const styles = StyleSheet.create({
  modal: {
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: "center",
  },
  modalTitle: {
    marginTop: 24,
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 19,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 24,
    textAlign: "center",
  },
  imageSeedWarning: {
    height: 90,
    width: 168,
  },
  button: {
    marginTop: 24,
    width: "100%",
  },
});

export default SeedWarning;
