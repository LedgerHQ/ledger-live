import React, { memo } from "react";
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Dimensions,
} from "react-native";
import Button from "../../../components/Button";
import colors from "../../../colors";
import BottomModal from "../../../components/BottomModal";

const { height } = Dimensions.get("window");

const ActionModal = ({ isOpened, onClose, children, actions = [] }) => {
  return (
    <BottomModal
      isOpened={isOpened}
      onClose={onClose}
      containerStyle={styles.modal}
    >
      <SafeAreaView style={styles.root}>
        {children}
        <View style={styles.modalFooter}>
          {actions.map(({ title, onPress, type = "primary" }, i) => (
            <Button
              containerStyle={styles.actionButton}
              type={type}
              title={title}
              onPress={onPress}
            />
          ))}
        </View>
      </SafeAreaView>
    </BottomModal>
  );
};

const styles = StyleSheet.create({
  root: {
    maxHeight: height - 100,
    flexDirection: "column",
    paddingTop: 36,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  modal: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  modalFooter: {
    width: "100%",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  actionButton: {
    height: 48,
    borderRadius: 3,
  },
});

export default memo(ActionModal);
