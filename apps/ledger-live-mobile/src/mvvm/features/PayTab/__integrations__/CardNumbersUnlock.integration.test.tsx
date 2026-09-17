import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import type { QueuedBottomSheetProps } from "@shared/ui-queued-bottom-sheet";
import { act, render, screen, waitFor } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import "./mockAppLockCrypto";
import { CardNumbersUnlockDialog } from "../components/CardNumbersUnlockDialog";
import { useUnlockForCardNumbers } from "../hooks/useUnlockForCardNumbers";

jest.mock("LLM/features/AppLock/adapters/verifierStore", () => ({
  readPasswordVerifier: jest.fn(),
}));

jest.mock("LLM/features/AppLock/hooks/usePasswordSetup", () => ({
  usePasswordSetup: () => ({ savePassword: savePasswordMock }),
}));

jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  const React = jest.requireActual<typeof import("react")>("react");

  function MockQueuedBottomSheet({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onOpened,
    ...props
  }: QueuedBottomSheetProps) {
    const shouldOpen = !!(isRequestingToBeOpened || isForcingToBeOpened);
    const { QueuedBottomSheet } = actual;
    React.useEffect(() => {
      if (shouldOpen) {
        onOpened?.();
      }
    }, [onOpened, shouldOpen]);
    return (
      <QueuedBottomSheet
        isRequestingToBeOpened={isRequestingToBeOpened}
        isForcingToBeOpened={isForcingToBeOpened}
        onOpened={onOpened}
        {...props}
      />
    );
  }

  return {
    ...actual,
    QueuedBottomSheet: MockQueuedBottomSheet,
  };
});

const savePasswordMock = jest.fn(async () => undefined);
const { derivePasswordDigest } = jest.requireMock("LLM/features/AppLock/adapters/passwordDigest");
const { readPasswordVerifier } = jest.requireMock("LLM/features/AppLock/adapters/verifierStore");

const SCRYPT = { cost: 16384, blockSize: 8, parallelization: 1, digestLength: 4 };
const storedVerifier = {
  version: 1,
  scrypt: SCRYPT,
  salt: Uint8Array.from([1, 2, 3, 4]),
  digest: Uint8Array.from([10, 20, 30, 40]),
};

function UnlockHarness() {
  const { unlock, dialog } = useUnlockForCardNumbers();

  return (
    <>
      <Button appearance="base" onPress={() => void unlock()}>
        View
      </Button>
      <CardNumbersUnlockDialog {...dialog} />
    </>
  );
}

function renderUnlock(hasPassword: boolean) {
  return render(<UnlockHarness />, {
    overrideInitialState: (state: State): State => ({
      ...state,
      appLock: { ...state.appLock, hasPassword },
    }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  savePasswordMock.mockResolvedValue(undefined);
  readPasswordVerifier.mockResolvedValue(storedVerifier);
  derivePasswordDigest.mockResolvedValue(Uint8Array.from([10, 20, 30, 40]));
});

describe("card numbers unlock", () => {
  it("should show the card numbers once the user sets a password", async () => {
    const { user } = renderUnlock(false);

    await user.press(screen.getByText("View"));
    await user.type(screen.getByTestId("card-numbers-password"), "secret");
    await user.type(screen.getByTestId("card-numbers-confirm-password"), "secret");
    await user.press(screen.getByText("Confirm"));

    expect(savePasswordMock).toHaveBeenCalledWith("secret");
    await waitFor(() => expect(screen.queryByText("Enter password")).not.toBeOnTheScreen());
  });

  it("should show the card numbers once the user enters their password", async () => {
    let finishCheck: ((ok: Uint8Array) => void) | undefined;
    derivePasswordDigest.mockImplementation(
      () =>
        new Promise(resolve => {
          finishCheck = resolve;
        }),
    );
    const { user } = renderUnlock(true);

    await user.press(screen.getByText("View"));
    await user.type(screen.getByTestId("card-numbers-password"), "secret");
    await user.press(screen.getByText("Confirm"));

    expect(screen.getByText("Cancel")).toBeDisabled();
    expect(screen.getByText("Confirm")).toBeDisabled();

    await act(async () => {
      finishCheck?.(Uint8Array.from([10, 20, 30, 40]));
    });

    expect(readPasswordVerifier).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText("Enter your password")).not.toBeOnTheScreen());
  });

  it("should keep the sheet open when the password is wrong", async () => {
    readPasswordVerifier.mockResolvedValue({
      ...storedVerifier,
      digest: Uint8Array.from([99, 99, 99, 99]),
    });
    const { user } = renderUnlock(true);

    await user.press(screen.getByText("View"));
    await user.type(screen.getByTestId("card-numbers-password"), "wrong");
    await user.press(screen.getByText("Confirm"));

    expect(await screen.findByText("Incorrect password")).toBeVisible();
    expect(screen.getByText("Enter your password")).toBeVisible();
  });

  it("should not reveal the card numbers when the user cancels the password sheet", async () => {
    const { user } = renderUnlock(true);

    await user.press(screen.getByText("View"));
    await user.press(screen.getByText("Cancel"));

    expect(screen.queryByText("Enter your password")).not.toBeOnTheScreen();
    expect(readPasswordVerifier).not.toHaveBeenCalled();
  });

  it("should not create a password when the two entries differ", async () => {
    const { user } = renderUnlock(false);

    await user.press(screen.getByText("View"));
    await user.type(screen.getByTestId("card-numbers-password"), "secret");
    await user.type(screen.getByTestId("card-numbers-confirm-password"), "other");
    await user.press(screen.getByText("Confirm"));

    expect(screen.getByText("Passwords don't match")).toBeVisible();
    expect(savePasswordMock).not.toHaveBeenCalled();
  });
});
