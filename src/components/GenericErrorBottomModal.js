/* @flow */
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import BottomModal from "./BottomModal";
import type { Props as BottomModalProps } from "./BottomModal";
import GenericErrorView from "./GenericErrorView";

type Props = BottomModalProps & {
  error: ?Error,
  onClose?: () => void,
  footerButtons?: React$Node,
  hasExportLogButton?: boolean,
};

function GenericErrorBottomModal({
  error,
  onClose,
  footerButtons,
  hasExportLogButton,
  ...otherProps
}: Props) {
  return (
    <BottomModal
      {...otherProps}
      id="ErrorModal"
      isOpened={!!error}
      onClose={onClose}
    >
      {error ? (
        <View style={styles.root}>
          <GenericErrorView
            error={error}
            hasExportLogButton={hasExportLogButton}
          />
          {footerButtons ? (
            <View style={styles.buttonsContainer}>{footerButtons}</View>
          ) : null}
        </View>
      ) : null}
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    minHeight: 280,
    paddingHorizontal: 20,
  },
  close: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexGrow: 1,
    paddingTop: 16,
  },
});

export default memo<Props>(GenericErrorBottomModal);
