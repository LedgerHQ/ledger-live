// @flow

import React from "react";
import { StyleSheet, View } from "react-native";
import BottomModal from "../components/BottomModal";
import LText from "../components/LText";

type Props = {
  data: ModalInfo[],
  isOpened: boolean,
  onClose: () => void,
};

export type ModalInfo = {
  description: React$Node,
  Icon?: () => React$Element<React$ElementType>,
  title: React$Node,
};

export default function InfoModal({ data, isOpened, onClose }: Props) {
  return (
    <BottomModal
      id="InfoModal"
      style={styles.root}
      isOpened={isOpened}
      onClose={onClose}
    >
      {data.map(({ description, Icon, title }, i) => (
        <View style={styles.section} key={i}>
          <View style={styles.header}>
            {Icon && (
              <View style={styles.iconWrapper}>
                <Icon />
              </View>
            )}
            <LText style={styles.title} semiBold secondary>
              {title}
            </LText>
          </View>
          <LText color="grey">{description}</LText>
        </View>
      ))}
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
  section: {
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconWrapper: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
  },
});
