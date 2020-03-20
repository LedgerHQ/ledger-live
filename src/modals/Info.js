// @flow

import React from "react";
import { StyleSheet, View } from "react-native";
import BottomModal from "../components/BottomModal";
import LText from "../components/LText";
import colors from "../colors";

interface Props {
  data: ModalInfo[];
  isOpened: boolean;
  onClose: () => void;
}

export interface ModalInfo {
  description: string;
  Icon: () => React$Element<React$ElementType>;
  title: string;
}

export default function InfoModal({ data, isOpened, onClose }: Props) {
  return (
    <BottomModal
      id="InfoModal"
      style={styles.root}
      isOpened={isOpened}
      onClose={onClose}
    >
      {data.map(({ description, Icon, title }, i) => (
        <View key={i}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Icon />
            </View>
            <LText style={styles.title} semiBold secondary>
              {title}
            </LText>
          </View>
          <LText style={styles.description}>{description}</LText>
        </View>
      ))}
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
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
    color: colors.darkBlue,
  },
  description: {
    color: colors.grey,
  },
});
