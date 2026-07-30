import React from "react";
import { render, screen } from "@testing-library/react-native";
import AppGeoBlocker from "../index";

jest.mock("@ledgerhq/live-common/api/ofacGeoBlockApi", () => ({
  ofacGeoBlockApi: {
    useCheckQuery: jest.fn(() => ({ data: false })),
  },
}));

const { ofacGeoBlockApi: mockedOfacApi } = jest.requireMock(
  "@ledgerhq/live-common/api/ofacGeoBlockApi",
) as { ofacGeoBlockApi: { useCheckQuery: jest.Mock } };

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

  it("renders children when not blocked", () => {
    mockedOfacApi.useCheckQuery.mockReturnValue({ data: false });
    const Child = () => <Text>Allowed</Text>;
    render(
      <AppGeoBlocker>
        <Child />
      </AppGeoBlocker>,
    );
    expect(screen.toJSON()).toBe("Allowed");
  });

  it("renders children while query is still loading (data undefined)", () => {
    mockedOfacApi.useCheckQuery.mockReturnValue({ data: undefined });
    const Child = () => <Text>Allowed</Text>;
    render(
      <AppGeoBlocker>
        <Child />
      </AppGeoBlocker>,
    );
    expect(screen.toJSON()).toBe("Allowed");
  });

  it("renders block screen when blocked", () => {
    mockedOfacApi.useCheckQuery.mockReturnValue({ data: true });
    render(
      <AppGeoBlocker>
        <Text>Allowed</Text>
      </AppGeoBlocker>,
    );

    const renderedNode = screen.toJSON();
    expect(renderedNode.includes("Location unavailable")).toBeTruthy();
    expect(renderedNode.includes("Ledger Wallet is not available in this location.")).toBeTruthy();
  });
});
