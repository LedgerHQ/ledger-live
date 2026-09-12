import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Button, Text } from "react-native";
import { setHasPassword } from "@features/platform-app-lock";
import type { QueuedBottomSheetProps } from "@shared/ui-queued-bottom-sheet";
import { screen, waitFor } from "@tests/test-renderer";
import { render } from "@tests/test-renderer";
import { NavigatorName } from "~/const";
import { useDispatch } from "~/context/hooks";
import { CardNumbersUnlockSheet } from "../components/CardNumbersUnlockSheet";
import { useUnlockForCardNumbers } from "../hooks/useUnlockForCardNumbers";

jest.mock("LLM/features/AppLock/hooks/usePasswordVerify", () => ({
  usePasswordVerify: () => async (password: string) => password === "secret",
}));

jest.mock("@shared/ui-queued-bottom-sheet", () => {
  const actual = jest.requireActual("@shared/ui-queued-bottom-sheet");
  const ReactActual = jest.requireActual<typeof import("react")>("react");
  const { QueuedBottomSheet } = actual;

  function MockQueuedBottomSheet({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onOpened,
    ...props
  }: QueuedBottomSheetProps) {
    const shouldOpen = !!(isRequestingToBeOpened || isForcingToBeOpened);
    ReactActual.useEffect(() => {
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

const Stack = createNativeStackNavigator();

function UnlockHost() {
  const { unlock, sheet } = useUnlockForCardNumbers();
  const [status, setStatus] = useState("idle");

  return (
    <>
      <Button
        title="View"
        onPress={() => {
          void unlock().then(ok => setStatus(ok ? "unlocked" : "cancelled"));
        }}
      />
      <Text>{status}</Text>
      <CardNumbersUnlockSheet {...sheet} />
    </>
  );
}

function PasswordAddStub() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  return (
    <>
      <Button title="Cancel add" onPress={() => navigation.goBack()} />
      <Button
        title="Save add"
        onPress={() => {
          dispatch(setHasPassword(true));
          navigation.goBack();
        }}
      />
    </>
  );
}

function renderUnlock(hasAppLockPassword = false) {
  return render(
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen name="PayUnlock" component={UnlockHost} />
      <Stack.Screen name={NavigatorName.PasswordAddFlow} component={PasswordAddStub} />
    </Stack.Navigator>,
    {
      overrideInitialState: state => ({
        ...state,
        appLock: {
          ...state.appLock,
          hasPassword: hasAppLockPassword,
        },
      }),
    },
  );
}

describe("Card numbers unlock", () => {
  it("should open the add-password flow when no password exists", async () => {
    const { user } = renderUnlock();

    await user.press(screen.getByText("View"));

    expect(screen.getByText("Save add")).toBeVisible();
  });

  it("should unlock after the user sets an AppLock password", async () => {
    const { user } = renderUnlock();

    await user.press(screen.getByText("View"));
    await user.press(screen.getByText("Save add"));

    await waitFor(() => expect(screen.getByText("unlocked")).toBeVisible());
  });

  it("should cancel when the user leaves the add-password flow", async () => {
    const { user } = renderUnlock();

    await user.press(screen.getByText("View"));
    await user.press(screen.getByText("Cancel add"));

    await waitFor(() => expect(screen.getByText("cancelled")).toBeVisible());
  });

  it("should unlock after the user enters the current password", async () => {
    const { user } = renderUnlock(true);

    await user.press(screen.getByText("View"));
    await user.type(await screen.findByTestId("card-numbers-unlock-password"), "secret");
    await user.press(screen.getByTestId("card-numbers-unlock-confirm"));

    await waitFor(() => expect(screen.getByText("unlocked")).toBeVisible());
  });

  it("should keep the sheet open when the password is wrong", async () => {
    const { user } = renderUnlock(true);

    await user.press(screen.getByText("View"));
    await user.type(await screen.findByTestId("card-numbers-unlock-password"), "nope");
    await user.press(screen.getByTestId("card-numbers-unlock-confirm"));

    expect(await screen.findByText("Incorrect password")).toBeVisible();
    expect(screen.getByText("idle")).toBeVisible();
  });
});
