import React from "react";
import { render, screen } from "@testing-library/react-native";

import AppVersionBlocker from "../index";

jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: () => (url: string) => url,
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    bottom: 0,
  }),
}));
jest.mock("@ledgerhq/live-common/hooks/useAppVersionBlockCheck", () => ({
  useAppVersionBlockCheck: jest.fn(),
}));
jest.mock("@ledgerhq/native-ui", () => ({
  Box: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Flex: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  BoxedIcon: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Icons: { CloudDownload: () => <></> },
  Button: ({ children, ...props }: { children: React.ReactNode; onPress?: () => void }) => (
    <button onClick={props.onPress}>{children}</button>
  ),
  Text: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));
jest.mock("styled-components/native", () => ({
  ...jest.requireActual("styled-components/native"),
  useTheme: () => ({
    colors: {
      background: { drawer: "#fff" },
      error: { c10: "#f00", c60: "#f00" },
      opacityDefault: { c05: "#eee", c50: "#ccc" },
      neutral: { c100: "#000", c70: "#777" },
    },
  }),
  StyleProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("~/utils/urls", () => ({
  urls: { playstore: "playstore.com", appstore: "appstore.com" },
}));

import { useAppVersionBlockCheck } from "@ledgerhq/live-common/hooks/useAppVersionBlockCheck";

const Text: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

describe("AppVersionBlocker", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when not blocked", async () => {
    (useAppVersionBlockCheck as jest.Mock).mockReturnValue({ shouldUpdate: false });
    const Child = () => <Text>Allowed</Text>;
    render(
      <AppVersionBlocker>
        <Child />
      </AppVersionBlocker>,
    );
    expect(screen.toJSON()).toBe("Allowed");
  });

  it("renders block screen when blocked", () => {
    (useAppVersionBlockCheck as jest.Mock).mockReturnValue({ shouldUpdate: true });
    render(
      <AppVersionBlocker>
        <Text>Allowed</Text>
      </AppVersionBlocker>,
    );

    const renderedNode = screen.toJSON();
    expect(renderedNode.includes("Allowed")).toBeFalsy();
  });
});
