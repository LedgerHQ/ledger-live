/* @flow */

import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Image, View, StyleSheet } from "react-native";
import BottomModal from "../components/BottomModal";
import Button from "../components/Button";
import BulletList, {
  BulletChevron,
  BulletItemText,
} from "../components/BulletList";

type Props = { onClose: any, isOpened: any, onAccept: () => void };

export default function PasslockDisclaimerModal({
  isOpened,
  onClose,
  onAccept = () => {},
}: Props) {
  const accept = useCallback(() => {
    onClose();
    onAccept();
  }, [onClose, onAccept]);

  return (
    <BottomModal
      id="PasslockDisclaimerModal"
      style={styles.root}
      isOpened={isOpened}
      onClose={onClose}
    >
      <Image
        style={styles.image}
        source={require("../images/shield-red.png")}
      />
      <View style={styles.wrapper}>
        <BulletList
          Bullet={BulletChevron}
          itemStyle={styles.item}
          list={[
            <BulletItemText style={styles.text} color="grey">
              <Trans i18nKey="onboarding.stepPassword.modal.step1" />
            </BulletItemText>,
            <BulletItemText style={styles.text} color="grey">
              <Trans i18nKey="onboarding.stepPassword.modal.step2" />
            </BulletItemText>,
            <BulletItemText style={styles.text} color="grey">
              <Trans i18nKey="onboarding.stepPassword.modal.step3" />
            </BulletItemText>,
          ]}
        />
      </View>
      <View style={styles.buttonWrapper}>
        <Button
          event="PasslockDisclaimerModalGotIt"
          type="primary"
          containerStyle={styles.buttonContainer}
          title={<Trans i18nKey="common.gotit" />}
          onPress={accept}
        />
      </View>
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  wrapper: {
    paddingRight: 16,
  },
  item: { paddingLeft: 0, marginRight: 16 },
  image: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  buttonWrapper: { marginTop: 16, flexDirection: "row" },
  buttonContainer: {
    flexGrow: 1,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
  },
});
