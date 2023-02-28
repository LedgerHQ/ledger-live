import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import QueuedDrawer from "./QueuedDrawer";
import type { Props as BottomModalProps } from "./QueuedDrawer";
import GenericErrorView from "./GenericErrorView";

type Props = Omit<BottomModalProps, "isRequestingToBeOpened"> & {
  error: Error | null | undefined;
  onClose?: () => void;
  footerButtons?: React.ReactNode;
  hasExportLogButton?: boolean;
};

function GenericErrorBottomModal({
  error,
  onClose,
  footerButtons,
  hasExportLogButton,
  ...otherProps
}: Props) {
  return (
    <QueuedDrawer
      {...otherProps}
      isRequestingToBeOpened={!!error}
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
    </QueuedDrawer>
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
