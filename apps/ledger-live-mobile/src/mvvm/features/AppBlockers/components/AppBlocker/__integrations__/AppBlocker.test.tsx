import React from "react";
import { render, screen } from "@testing-library/react-native";

import AppBlocker from "../index";

jest.mock("@ledgerhq/native-ui", () => ({
  Box: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Flex: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

const Text: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

describe("AppBlocker", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when not not blocked", async () => {
    const Child = () => <Text>Allowed</Text>;
    render(
      <AppBlocker
        blocked={false}
        TitleComponent={() => "TITLE_BLOCKED_SCREEN"}
        DescriptionComponent={() => "DESC_BLOCKED_SCREEN"}
        IconComponent={() => null}
        BottomCTAComponent={() => null}
      >
        <Child />
      </AppBlocker>,
    );
    expect(screen.toJSON()).toBe("Allowed");
  });

  it("renders block screen when blocked", () => {
    render(
      <AppBlocker
        blocked
        TitleComponent={() => "TITLE_BLOCKED_SCREEN"}
        DescriptionComponent={() => "DESC_BLOCKED_SCREEN"}
        IconComponent={() => null}
        BottomCTAComponent={() => null}
      >
        <Text>Allowed</Text>
      </AppBlocker>,
    );

    const renderedNode = screen.toJSON();
    expect(renderedNode.includes("TITLE_BLOCKED_SCREEN")).toBeTruthy();
    expect(renderedNode.includes("DESC_BLOCKED_SCREEN")).toBeTruthy();
  });
});
