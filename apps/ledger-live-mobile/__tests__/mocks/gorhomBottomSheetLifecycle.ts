import React from "react";

type BottomSheetModalProps = {
  onAnimate?: (
    fromIndex: number,
    toIndex: number,
    fromPosition?: number,
    toPosition?: number,
  ) => void;
  onChange?: (index: number, position?: number, type?: number) => void;
  onDismiss?: () => void;
  children?: React.ReactNode | ((props: object) => React.ReactNode);
};

export function createGorhomBottomSheetLifecycleMock() {
  const actualMock = jest.requireActual("@gorhom/bottom-sheet/mock");

  class BottomSheetModal extends React.Component<BottomSheetModalProps> {
    present() {
      this.props.onAnimate?.(-1, 0, 0, 0);
      this.props.onChange?.(0, 0, 0);
    }
    dismiss() {
      this.props.onAnimate?.(0, -1, 0, 0);
      this.props.onChange?.(-1, 0, 0);
      this.props.onDismiss?.();
    }
    close() {
      this.dismiss();
    }
    forceClose() {
      this.dismiss();
    }
    snapToIndex() {}
    snapToPosition() {}
    expand() {}
    collapse() {}
    render() {
      const { children } = this.props;
      return typeof children === "function" ? children({}) : children;
    }
  }

  return { ...actualMock, BottomSheetModal };
}
