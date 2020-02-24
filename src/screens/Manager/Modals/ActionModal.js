import React, { memo } from "react";
import { StyleSheet, SafeAreaView, View } from "react-native";
import type { BaseButtonProps } from "../../../components/Button";
import Button from "../../../components/Button";
import BottomModal from "../../../components/BottomModal";
import getWindowDimensions from "../../../logic/getWindowDimensions";

const { height } = getWindowDimensions();

type Props = {
  isOpened: boolean,
  onClose: () => void,
  children: Node,
  actions: Array<BaseButtonProps>,
  ...
};

const ActionModal = ({
  isOpened,
  onClose,
  children,
  actions = [],
  ...rest
}: Props) => (
  <BottomModal
    {...rest}
    isOpened={isOpened}
    onClose={onClose}
    preventBackdropClick={false}
    containerStyle={{ paddingBottom: 116 }}
    coverScreen
  >
    <SafeAreaView style={styles.root}>
      {children}
      {actions.length > 0 && (
        <View style={styles.modalFooter}>
          {actions.map(({ title, onPress, type = "primary", ...props }, i) => (
            <Button
              key={i}
              containerStyle={styles.actionButton}
              type={type}
              title={title}
              onPress={onPress}
              useTouchable
              {...props}
            />
          ))}
        </View>
      )}
    </SafeAreaView>
  </BottomModal>
);

const styles = StyleSheet.create({
  root: {
    maxHeight: height - 60,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  modalFooter: {
    width: "100%",
    marginTop: 16,
    paddingHorizontal: 16,
  },
  actionButton: {
    height: 48,
    borderRadius: 3,
  },
});

export default memo(ActionModal);
