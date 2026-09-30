import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import {
  clearContentAbTestOverrides,
  getContentAbTests,
  isContentAbTestOverridden,
  setContentAbTestCopy,
} from "@features/platform-content-ab-tests";
import ContentAbTestEdit from "./ContentAbTestEdit";
import { i18n } from "~/context/Locale";

jest.mock("~/context/Locale", () => ({
  i18n: {
    language: "en",
    resolvedLanguage: "en",
    emit: jest.fn(),
  },
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "settings.debug.featureFlagsRestore": "Restore",
        "common.apply": "Apply",
        "settings.debug.contentAbTests.invalidPayload": "Invalid payload",
      })[key] ?? key,
  }),
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const { Pressable, Text, View } = require("react-native");
  return {
    Box: ({ children }: { children?: import("react").ReactNode }) => <View>{children}</View>,
    Text: ({ children }: { children?: import("react").ReactNode }) => <Text>{children}</Text>,
    Button: ({
      children,
      onPress,
      disabled,
    }: {
      children: import("react").ReactNode;
      onPress?: () => void;
      disabled?: boolean;
    }) => (
      <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
    Switch: ({
      checked,
      onCheckedChange,
      testID,
    }: {
      checked: boolean;
      onCheckedChange: (enabled: boolean) => void;
      testID?: string;
    }) => (
      <View
        testID={testID}
        accessibilityState={{ checked }}
        onCheckedChange={() => onCheckedChange(!checked)}
      />
    ),
  };
});

const remoteExperiment = (payload: object) => ({
  feature_copy_upgrade_banner: {
    asString: () => JSON.stringify(payload),
    getSource: () => "remote" as const,
  },
});

function renderEdit(testName: string, testValue = getContentAbTests()[testName]) {
  return render(<ContentAbTestEdit testName={testName} testValue={testValue} />);
}

describe("ContentAbTestEdit", () => {
  beforeEach(() => {
    jest.mocked(i18n.emit).mockClear();
    clearContentAbTestOverrides();
    setContentAbTestCopy(
      remoteExperiment({ enabled: true, copy: { "banner.title": "Remote title" } }),
    );
  });

  it("toggles enabled on the live payload", () => {
    renderEdit("upgradeBanner");

    act(() => {
      fireEvent(screen.getByTestId("content-ab-test-enabled"), "onCheckedChange");
    });

    expect(isContentAbTestOverridden("upgradeBanner")).toBe(true);
    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: false,
      copy: { "banner.title": "Remote title" },
    });
  });

  it("overrides copy from the edited payload", () => {
    renderEdit("upgradeBanner");

    fireEvent.changeText(
      screen.getByTestId("content-ab-test-payload"),
      JSON.stringify({ enabled: true, copy: { "banner.title": "Mocked title" } }),
    );
    act(() => {
      fireEvent.press(screen.getByText("Apply"));
    });

    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: true,
      copy: { "banner.title": "Mocked title" },
    });
    expect(i18n.emit).toHaveBeenCalledWith("languageChanged", "en");
  });

  it("accepts a payload and drops a malformed trackingConfiguration", () => {
    renderEdit("newExperiment", undefined);

    fireEvent.changeText(
      screen.getByTestId("content-ab-test-payload"),
      JSON.stringify({
        enabled: true,
        copy: { "banner.title": "Mocked title" },
        trackingConfiguration: {},
      }),
    );
    act(() => {
      fireEvent.press(screen.getByText("Apply"));
    });

    expect(getContentAbTests().newExperiment).toEqual({
      enabled: true,
      copy: { "banner.title": "Mocked title" },
    });
  });

  it("restores the remote payload", () => {
    renderEdit("upgradeBanner", { enabled: false, copy: {} });

    act(() => {
      fireEvent.press(screen.getByText("Restore"));
    });

    expect(isContentAbTestOverridden("upgradeBanner")).toBe(false);
    expect(getContentAbTests().upgradeBanner).toEqual({
      enabled: true,
      copy: { "banner.title": "Remote title" },
    });
  });
});
