import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import {
  clearContentAbTestOverrides,
  hasContentAbTestOverrides,
  setContentAbTestCopy,
  setContentAbTestOverride,
} from "@features/platform-content-ab-tests";
import { createFeatureFlagsMiddleware, featureFlagsReducer } from "@shared/feature-flags";
import DebugFeatureFlags from "./index";
import { i18n } from "~/context/Locale";

jest.mock("@react-native-firebase/app", () => ({
  getApp: () => ({ options: { projectId: "ledger-live-staging" } }),
}));

jest.mock("~/context/Locale", () => ({
  i18n: {
    language: "en",
    resolvedLanguage: "en",
    emit: jest.fn(),
  },
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "settings.debug.featureFlagsTitle": "Feature flags",
        "settings.debug.firebaseProject": "Firebase project",
        "settings.debug.showBannerDesc": "Show banner",
        "settings.debug.featureFlagsTabAll": "All",
        "settings.debug.featureFlagsTabGroups": "Groups",
        "settings.debug.featureFlagsRestoreAll": "Restore all flag values",
        "settings.debug.featureFlagsRestore": "Restore",
        "common.apply": "Apply",
        "settings.debug.contentAbTests.invalidPayload": "Invalid payload",
      })[key] ?? key,
  }),
}));

jest.mock("styled-components/native", () => {
  const actual = jest.requireActual("styled-components/native");
  return new Proxy(actual, {
    get(target, prop, receiver) {
      if (prop === "useTheme") {
        return () => ({
          colors: {
            error: { c60: "red" },
            primary: { c80: "blue" },
            neutral: { c30: "gray", c100: "black" },
          },
        });
      }
      return Reflect.get(target, prop, receiver);
    },
  });
});

jest.mock("@ledgerhq/native-ui", () => {
  const React = require("react");
  const { Pressable, Text, TextInput, View } = require("react-native");
  return {
    Text: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    Flex: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    Divider: () => <View />,
    Tag: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    Link: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
      <Pressable accessibilityRole="link" onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
    Button: ({
      children,
      onPress,
      disabled,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      disabled?: boolean;
    }) => (
      <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
    Switch: ({ checked, onChange }: { checked: boolean; onChange: (enabled: boolean) => void }) => (
      <View
        accessibilityRole="switch"
        accessibilityState={{ checked }}
        onChange={() => onChange(!checked)}
      />
    ),
    ChipTabs: ({
      labels,
      onChange,
    }: {
      labels: string[];
      activeIndex: number;
      onChange: (index: number) => void;
    }) => (
      <View>
        {labels.map((label, index) => (
          <Pressable key={label} accessibilityRole="tab" onPress={() => onChange(index)}>
            <Text>{label}</Text>
          </Pressable>
        ))}
      </View>
    ),
    SearchInput: ({
      value,
      onChange,
      placeholder,
    }: {
      value: string;
      onChange: (value: string) => void;
      placeholder?: string;
    }) => <TextInput value={value} placeholder={placeholder} onChangeText={onChange} />,
  };
});

jest.mock("@ledgerhq/native-ui/components/Form/Input/BaseInput/index", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    InputRenderRightContainer: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock("~/components/Alert", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ children, title }: { children?: React.ReactNode; title?: string }) => (
      <Text>{title ?? children}</Text>
    ),
  };
});

jest.mock("~/components/KeyboardView", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock("~/components/NavigationScrollView", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

const enabled = { enabled: true, copy: { "banner.title": "Remote title" } };

function experiment(id: string, payload: object) {
  return {
    [`feature_copy_${id}`]: {
      asString: () => JSON.stringify(payload),
      getSource: () => "remote" as const,
    },
  };
}

function renderScreen() {
  const store = configureStore({
    reducer: { featureFlags: featureFlagsReducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(createFeatureFlagsMiddleware({ resolutionConfig: {} })),
  });
  return render(
    <Provider store={store}>
      <DebugFeatureFlags />
    </Provider>,
  );
}

describe("DebugFeatureFlags content A/B tests", () => {
  beforeEach(() => {
    jest.mocked(i18n.emit).mockClear();
    clearContentAbTestOverrides();
    setContentAbTestCopy({
      ...experiment("upgrade_banner", enabled),
      ...experiment("zeta_banner", { enabled: false, copy: { "banner.title": "Other" } }),
    });
  });

  it("should list experiments and filter them by name", () => {
    renderScreen();

    expect(screen.getByText("upgradeBanner")).toBeVisible();
    expect(screen.getByText("zetaBanner")).toBeVisible();
    expect(screen.getByRole("button", { name: "Restore all flag values" })).toBeDisabled();

    fireEvent.changeText(screen.getByPlaceholderText("Search flag"), "upgrade");

    expect(screen.getByText("upgradeBanner")).toBeVisible();
    expect(screen.queryByText("zetaBanner")).toBeNull();
  });

  it("should keep the group visible when the search matches its name", () => {
    renderScreen();

    fireEvent.changeText(screen.getByPlaceholderText("Search flag"), "content ab");
    fireEvent.press(screen.getByRole("tab", { name: "Groups" }));

    expect(screen.getByText("contentAbTests")).toBeVisible();
    expect(screen.queryByText("upgradeBanner")).toBeNull();
  });

  it("should restore content overrides together with feature flags", () => {
    setContentAbTestOverride("upgradeBanner", {
      ...enabled,
      copy: { "banner.title": "Local" },
    });
    renderScreen();

    const restoreAll = screen.getByRole("button", { name: "Restore all flag values" });
    expect(restoreAll).not.toBeDisabled();

    act(() => {
      fireEvent.press(restoreAll);
    });

    expect(hasContentAbTestOverrides()).toBe(false);
    expect(i18n.emit).toHaveBeenCalledWith("languageChanged", "en");
  });
});
