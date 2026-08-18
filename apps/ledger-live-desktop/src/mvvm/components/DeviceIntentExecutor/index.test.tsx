import React from "react";
import { render } from "@testing-library/react";
import type { DeviceIntentExecutorProps } from "@features/platform-device-intent";
import { DeviceIntentExecutorLWD } from ".";
import type { InitializerConfig } from "./DeviceContextInitializerComponentLWD";
import type { InitializationInput } from "./types";
import { useDeviceIntentExecutorLWDViewModel } from "./useDeviceIntentExecutorLWDViewModel";

let mockDialogProps: { onOpenChange: (open: boolean) => void } | undefined;
let mockDialogContentProps:
  | {
      onPointerDownOutside: (event: { preventDefault: () => void }) => void;
      onEscapeKeyDown: (event: { preventDefault: () => void }) => void;
    }
  | undefined;
let mockDialogHeaderProps: { onClose?: () => void } | undefined;

jest.mock("@ledgerhq/lumen-ui-react", () => ({
  Dialog: ({
    children,
    ...props
  }: React.PropsWithChildren<{ onOpenChange: (open: boolean) => void }>) => {
    mockDialogProps = props;
    return <div>{children}</div>;
  },
  DialogContent: ({
    children,
    ...props
  }: React.PropsWithChildren<{
    onPointerDownOutside: (event: { preventDefault: () => void }) => void;
    onEscapeKeyDown: (event: { preventDefault: () => void }) => void;
  }>) => {
    mockDialogContentProps = props;
    return <div>{children}</div>;
  },
  DialogBody: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: (props: { onClose?: () => void }) => {
    mockDialogHeaderProps = props;
    return <div />;
  },
}));

jest.mock(
  "@features/platform-device-intent",
  () => ({
    DeviceIntentExecutor: () => null,
  }),
  { virtual: true },
);

jest.mock("LLD/components/DialogBackgroundGradient", () => ({
  DialogBackgroundToneProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

jest.mock("./DeviceConnectionComponentLWD", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("./DeviceContextInitializerComponentLWD", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("./components/DeviceDisconnected", () => ({
  DeviceDisconnected: () => null,
}));

jest.mock("./components/IntentError", () => ({
  IntentError: () => null,
}));

jest.mock("./components/InvalidOperation", () => ({
  InvalidOperation: () => null,
}));

jest.mock("./useDeviceIntentExecutorLWDViewModel", () => ({
  useDeviceIntentExecutorLWDViewModel: jest.fn(),
}));

const mockedUseViewModel = jest.mocked(useDeviceIntentExecutorLWDViewModel);

type Props = DeviceIntentExecutorProps<unknown, unknown, unknown, InitializationInput> & {
  initializerConfig?: InitializerConfig;
  sourceFlow: "swap";
};

function makeProps(): Props {
  return {
    deviceConnectionParams: {},
    deviceInitializationInput: {} as InitializationInput,
    onExecutorStateChanged: jest.fn(),
    intent: {} as Props["intent"],
    intentComponentExtraProps: undefined,
    onIntentJobStateChanged: jest.fn(),
    onIntentJobComplete: jest.fn(),
    onIntentJobError: jest.fn(),
    enabled: true,
    onUserCancel: jest.fn(),
    cancelIntentRequestId: undefined,
    sourceFlow: "swap",
  };
}

describe("DeviceIntentExecutorLWD", () => {
  const onOpenChange = jest.fn();
  const onHeaderClosePressed = jest.fn();
  const onOverlayDismiss = jest.fn();
  const onEscapeKeyDown = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockDialogProps = undefined;
    mockDialogContentProps = undefined;
    mockDialogHeaderProps = undefined;
    mockedUseViewModel.mockReturnValue({
      wrappedProps: makeProps(),
      hasHeaderOverride: false,
      headerContextValue: {
        requestHeaderOverride: jest.fn(() => jest.fn()),
      },
      isDeviceBlocked: false,
      onOpenChange,
      onHeaderClosePressed,
      onOverlayDismiss,
      onEscapeKeyDown,
    });
  });

  it("allows dialog dismiss interactions when no device operation is blocked", () => {
    render(<DeviceIntentExecutorLWD {...makeProps()} />);
    const preventDefault = jest.fn();

    mockDialogContentProps?.onPointerDownOutside({ preventDefault });
    mockDialogContentProps?.onEscapeKeyDown({ preventDefault });
    mockDialogProps?.onOpenChange(false);
    mockDialogHeaderProps?.onClose?.();

    expect(preventDefault).not.toHaveBeenCalled();
    expect(onOverlayDismiss).toHaveBeenCalledTimes(1);
    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onHeaderClosePressed).toHaveBeenCalledTimes(1);
  });

  it("prevents dialog dismiss interactions while a device operation is blocked", () => {
    mockedUseViewModel.mockReturnValue({
      wrappedProps: makeProps(),
      hasHeaderOverride: false,
      headerContextValue: {
        requestHeaderOverride: jest.fn(() => jest.fn()),
      },
      isDeviceBlocked: true,
      onOpenChange,
      onHeaderClosePressed,
      onOverlayDismiss,
      onEscapeKeyDown,
    });
    render(<DeviceIntentExecutorLWD {...makeProps()} />);
    const preventDefault = jest.fn();

    mockDialogContentProps?.onPointerDownOutside({ preventDefault });
    mockDialogContentProps?.onEscapeKeyDown({ preventDefault });
    mockDialogProps?.onOpenChange(false);

    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(onOverlayDismiss).not.toHaveBeenCalled();
    expect(onEscapeKeyDown).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(mockDialogHeaderProps?.onClose).toBeUndefined();
  });
});
