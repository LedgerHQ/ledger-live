import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { createStore, combineReducers } from "redux";
import { DefaultTheme, ThemeProvider } from "styled-components";

import DeviceAction from "./index";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

const mockTheme = {
  colors: {
    palette: {
      type: "light",
      text: {
        shade5: "#ccc",
        shade10: "#bbb",
        shade20: "#aaa",
        shade30: "#999",
        shade40: "#888",
        shade50: "#777",
        shade60: "#666",
        shade70: "#555",
        shade80: "#444",
        shade90: "#333",
        shade100: "#222",
      },
      error: {
        c50: "#ff3333",
      },
      neutral: {
        c100: "#000000",
      },
      primary: {
        c80: "#0055ff",
        c60: "#3366ff",
      },
    },
    error: {
      c50: "#ff3333",
    },
    neutral: {
      c100: "#000000",
    primary: {
      c80: "#0055ff",
      c60: "#3366ff",
    },
  },
  error: {
    c50: "#ff3333",
  },
  neutral: {
    c100: "#000000",
  },
  primary: {
    c80: "#0055ff",
    c60: "#3366ff",
  },
  space: [0, 4, 8, 12, 16, 20, 24, 28, 32],
  fontSizes: [10, 12, 14, 16, 18, 20, 22],
  transition: (props: string[], duration: string) => props.map(p => `${p} ${duration}`).join(", "),
} as unknown as DefaultTheme;

function renderWithRedux(ui: React.ReactElement) {
  const store = createStore(
    combineReducers({
      devices: () => ({
        currentDevice: {
          modelId: "nanoX",
          name: "Nano X",
        },
      }),
      settings: () => ({
        vaultSigner: {
          enabled: false,
        },
        deprecationDoNotRemind: [],
      }),
    }),
  );

  return render(
    <Provider store={store}>
      <ThemeProvider theme={mockTheme}>{ui}</ThemeProvider>
    </Provider>,
  );
}

describe("DeviceAction - Deprecation", () => {
  it("should render deprecation warning when deprecate and deprecateData are provided", () => {
    const mockOnContinue = jest.fn();
    const deprecateData = {
      deprecatedFlowExceptions: [],
      tokenExceptions: [],
      coin: "Bitcoin",
      date: "2023-12-31",
      onContinue: mockOnContinue,
    };

    const mockAction = {
      useHook: jest.fn(() => ({
        deprecate: true,
        deprecateData,
        displayDeprecateWarning: true,
        warningClearSigning: false,
      })),
      mapResult: jest.fn(),
    };

    renderWithRedux(
      <DeviceAction
        action={mockAction}
        request={{}}
        location={HOOKS_TRACKING_LOCATIONS.sendModal}
      />,
    );

    screen.debug();

    expect(screen.getByText(content => content.includes("Bitcoin"))).toBeInTheDocument();
    expect(screen.getByText(/2023-12-31/)).toBeInTheDocument();

    const continueButton = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    expect(mockOnContinue).toHaveBeenCalled();
  });

  it("should not render deprecation warning if deprecate is false", () => {
    const mockAction = {
      useHook: jest.fn(() => ({
        deprecate: false,
      })),
      mapResult: jest.fn(),
    };

    renderWithRedux(
      <DeviceAction
        action={mockAction}
        request={{}}
        location={HOOKS_TRACKING_LOCATIONS.sendModal}
      />,
    );

    screen.debug();

    expect(screen.queryByText(/deprecated/i)).not.toBeInTheDocument();
  });

  it("should call onContinue immediately if skipDeprecation is true", () => {
    const mockOnContinue = jest.fn();
    const deprecateData = {
      deprecatedFlowExceptions: ["someFlow"],
      tokenExceptions: ["someToken"],
      coin: "Bitcoin",
      date: "2023-12-31",
    };

    const mockAction = {
      useHook: jest.fn(() => ({
        deprecate: true,
        deprecateData,
        onContinue: mockOnContinue,
        displayDeprecateWarning: false,
      })),
      mapResult: jest.fn(),
    };

    renderWithRedux(
      <DeviceAction
        action={mockAction}
        request={{ tokenCurrency: { name: "someToken" } }}
        location={HOOKS_TRACKING_LOCATIONS.sendModal}
      />,
    );

    expect(mockOnContinue).toHaveBeenCalled();
  });
});
