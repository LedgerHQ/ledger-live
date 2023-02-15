import React, { memo } from "react";
import QueuedDrawer from "./QueuedDrawer";
import type { Props as BottomModalProps } from "./QueuedDrawer";
import GenericErrorView from "./GenericErrorView";

type Props = Omit<BottomModalProps, "isRequestingToBeOpened"> & {
  args?: { [key: string]: string };
  error: Error | null | undefined;
  hasExportLogButton?: boolean;
  onClose?: () => void;
  onPrimaryPress?: () => void;
};

function GenericErrorBottomModal({
  args,
  error,
  hasExportLogButton,
  onClose,
  onPrimaryPress,
  ...otherProps
}: Props) {
  return (
    <QueuedDrawer
      {...otherProps}
      isRequestingToBeOpened={!!error}
      onClose={onClose}
    >
      {error ? (
        <GenericErrorView
          error={error}
          isModal
          onPrimaryPress={onPrimaryPress}
          args={args}
        />
      ) : null}
    </QueuedDrawer>
  );
}

export default memo<Props>(GenericErrorBottomModal);
