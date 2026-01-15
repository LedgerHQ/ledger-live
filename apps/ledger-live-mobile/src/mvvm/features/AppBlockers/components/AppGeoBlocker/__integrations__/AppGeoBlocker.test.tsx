import React from "react";
import { render, screen } from "@testing-library/react-native";

import { InitialQueriesContext } from "LLM/contexts/InitialQueriesContext";
import AppGeoBlocker from "../index";

jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: () => (url: string) => url,
}));
jest.mock("@ledgerhq/native-ui", () => ({
  Box: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Flex: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Icons: { DeleteCircleFill: () => <></>, ExternalLink: () => <></> },
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
jest.mock("~/utils/urls", () => ({ urls: { geoBlock: { learnMore: "https://test.url" } } }));

const Text: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

describe("AppGeoBlocker", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when not loading and not blocked", async () => {
    const Child = () => <Text>Allowed</Text>;
    render(
      <AppGeoBlocker>
        <Child />
      </AppGeoBlocker>,
      { wrapper: getWrapper({ blocked: false, isLoading: false }) },
    );
    expect(screen.toJSON()).toBe("Allowed");
  });

  it("don't block children rendering while loading", () => {
    const Child = () => <Text>Allowed</Text>;
    render(
      <AppGeoBlocker>
        <Child />
      </AppGeoBlocker>,
      { wrapper: getWrapper({ blocked: false, isLoading: true }) },
    );
    expect(screen.toJSON()).toBe("Allowed");
  });

  it("renders block screen when blocked", () => {
    render(
      <AppGeoBlocker>
        <Text>Allowed</Text>
      </AppGeoBlocker>,
      { wrapper: getWrapper({ blocked: true, isLoading: false }) },
    );

    const renderedNode = screen.toJSON();
    expect(renderedNode.includes("geoBlocking.title")).toBeTruthy();
    expect(renderedNode.includes("geoBlocking.description")).toBeTruthy();
  });
});

function getWrapper(ofacResult: { blocked: boolean; isLoading: boolean }) {
  const value = { ofacResult, firebaseIsReady: true };
  return ({ children }: React.PropsWithChildren) => (
    <InitialQueriesContext.Provider value={value}>{children}</InitialQueriesContext.Provider>
  );
}
