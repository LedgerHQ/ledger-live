import React from "react";
import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/devices";
import i18next from "i18next";
import { render, screen, waitFor } from "@tests/test-renderer";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import CounterfeitWarningDrawer from "..";
import {
  EVENT_CONCERN,
  EVENT_DISMISSED,
  EVENT_PROCEED,
  EVENT_SHOWN,
} from "../analytics";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = require("react-native");
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  return {
    ...actual,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetHeader: () => <RN.View testID="bottom-sheet-header" />,
  };
});

jest.mock("LLM/components/QueuedDrawer/QueuedDrawerBottomSheet", () => {
  const { View, Pressable, Text } = require("react-native");
  return function MockQueuedDrawerBottomSheet({
    children,
    onClose,
    isRequestingToBeOpened,
    testID,
  }: {
    children: React.ReactNode;
    onClose?: () => void;
    isRequestingToBeOpened?: boolean;
    testID?: string;
  }) {
    if (!isRequestingToBeOpened) {
      return null;
    }
    return (
      <View testID={testID}>
        {children}
        <Pressable accessibilityLabel="Close" onPress={onClose}>
          <Text>Close</Text>
        </Pressable>
      </View>
    );
  };
});

const trackMock = jest.mocked(track);

const analyticsPayload = { deviceModelId: DeviceModelId.nanoX, flow: "Onboarding" };

const renderDrawer = (isOpen = true) => {
  const onProceed = jest.fn();
  const onDismiss = jest.fn();

  const view = render(
    <CounterfeitWarningDrawer
      isOpen={isOpen}
      deviceModelId={DeviceModelId.nanoX}
      onProceed={onProceed}
      onDismiss={onDismiss}
    />,
  );

  return { ...view, onProceed, onDismiss };
};

describe("CounterfeitWarningDrawer Integration", () => {
  let openURLSpy: jest.SpiedFunction<typeof Linking.openURL>;

  beforeEach(() => {
    jest.clearAllMocks();
    openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    openURLSpy.mockRestore();
  });

  describe("rendering", () => {
    it("should render when isOpen is true", async () => {
      renderDrawer(true);

      await waitFor(() => {
        expect(screen.getByTestId("counterfeit-warning-drawer")).toBeOnTheScreen();
      });
      expect(screen.getByText(i18next.t("onboarding.counterfeitWarning.title"))).toBeOnTheScreen();
    });

    it("should not render when isOpen is false", () => {
      renderDrawer(false);
      expect(screen.queryByTestId("counterfeit-warning-drawer")).toBeNull();
      expect(trackMock).not.toHaveBeenCalledWith(EVENT_SHOWN, expect.anything());
    });
  });

  describe("user interactions", () => {
    it("should track shown once and handle primary CTA", async () => {
      const { user, onProceed } = renderDrawer(true);

      await waitFor(() => {
        expect(screen.getByTestId("counterfeit-warning-drawer")).toBeOnTheScreen();
      });
      expect(trackMock).toHaveBeenCalledWith(EVENT_SHOWN, analyticsPayload);

      await user.press(
        screen.getByText(i18next.t("onboarding.counterfeitWarning.cta.primary")),
      );
      expect(trackMock).toHaveBeenCalledWith(EVENT_PROCEED, analyticsPayload);
      expect(onProceed).toHaveBeenCalledTimes(1);
    });

    it("should open the genuine check URL and track concern on secondary CTA", async () => {
      const { user } = renderDrawer(true);

      await waitFor(() => {
        expect(screen.getByTestId("counterfeit-warning-drawer")).toBeOnTheScreen();
      });

      await user.press(
        screen.getByText(i18next.t("onboarding.counterfeitWarning.cta.secondary")),
      );
      expect(trackMock).toHaveBeenCalledWith(EVENT_CONCERN, analyticsPayload);
      expect(openURLSpy).toHaveBeenCalledWith(urls.genuineCheck.learnMore);
    });

    it("should track dismissed and call onDismiss when closed", async () => {
      const { user, onDismiss } = renderDrawer(true);

      await waitFor(() => {
        expect(screen.getByTestId("counterfeit-warning-drawer")).toBeOnTheScreen();
      });

      await user.press(screen.getByLabelText("Close"));

      expect(trackMock).toHaveBeenCalledWith(EVENT_DISMISSED, analyticsPayload);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
