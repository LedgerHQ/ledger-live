import React from "react";
import { render, screen } from "@tests/test-renderer";
import { BackToInternalDomain } from "./BackToLwButton";
import { NavigatorName, ScreenName } from "~/const";
import storage from "LLM/storage";
import { track } from "~/analytics";
import { handleBackToLwEntryPoint } from "./handleBackToLwEntryPoint";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("LLM/storage", () => ({
  __esModule: true,
  default: {
    getString: jest.fn(),
  },
}));

jest.mock("~/analytics", () => ({
  track: jest.fn(),
}));

jest.mock("./handleBackToLwEntryPoint", () => ({
  handleBackToLwEntryPoint: jest.fn(),
}));

const mockedStorage = jest.mocked(storage);
const mockedTrack = jest.mocked(track);
const mockedHandleBackToLwEntryPoint = jest.mocked(handleBackToLwEntryPoint);

describe("BackToInternalDomain", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getString.mockResolvedValue(null);
  });

  it("should render with default back label when btnText is not provided", () => {
    render(
      <BackToInternalDomain
        config={{
          screen: ScreenName.ExchangeBuy,
        }}
      />,
    );

    expect(screen.getByText("Back")).toBeOnTheScreen();
  });

  it("should render with custom back label when btnText is provided", () => {
    render(
      <BackToInternalDomain
        config={{
          screen: ScreenName.ExchangeBuy,
          btnText: "Live App",
        }}
      />,
    );

    expect(screen.getByText("Back to Live App")).toBeOnTheScreen();
  });

  it("should call handleBackToLwEntryPoint with correct screen when button is pressed", async () => {
    const { user } = render(
      <BackToInternalDomain
        config={{
          screen: ScreenName.Card,
        }}
      />,
    );

    await user.press(screen.getByText("Back"));

    expect(mockedHandleBackToLwEntryPoint).toHaveBeenCalledTimes(1);
    expect(mockedHandleBackToLwEntryPoint).toHaveBeenCalledWith(
      { navigate: mockNavigate },
      ScreenName.Card,
      { referrer: "isExternal" },
    );
  });

  it("should navigate to Exchange when screen is ExchangeBuy", async () => {
    const { user } = render(
      <BackToInternalDomain
        config={{
          screen: ScreenName.ExchangeBuy,
        }}
      />,
    );

    await user.press(screen.getByText("Back"));

    expect(mockedHandleBackToLwEntryPoint).toHaveBeenCalledWith(
      { navigate: mockNavigate },
      ScreenName.ExchangeBuy,
      { referrer: "isExternal" },
    );
  });

  it("should track button_clicked with back to quote when last-screen is compare_providers", async () => {
    mockedStorage.getString.mockImplementation((key: string): Promise<string | null> => {
      const data: Record<string, string> = {
        "manifest-id": "provider-123",
        "last-screen": "compare_providers",
        "flow-name": "buy-flow",
      };
      return Promise.resolve(data[key] ?? null);
    });

    const { user } = render(
      <BackToInternalDomain
        config={{
          screen: ScreenName.ExchangeSell,
        }}
      />,
    );

    await user.press(screen.getByText("Back"));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      button: "back to quote",
      provider: "provider-123",
      flow: "buy-flow",
    });
  });

  it("should track button_clicked with back to liveapp when last-screen is not compare_providers", async () => {
    mockedStorage.getString.mockImplementation((key: string): Promise<string | null> => {
      const data: Record<string, string> = {
        "manifest-id": "provider-456",
        "last-screen": "quote",
        "flow-name": "sell-flow",
      };
      return Promise.resolve(data[key] ?? null);
    });

    const { user } = render(
      <BackToInternalDomain
        config={{
          screen: NavigatorName.CardTab,
        }}
      />,
    );

    await user.press(screen.getByText("Back"));

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      button: "back to liveapp",
      provider: "provider-456",
      flow: "sell-flow",
    });
  });

  it("should not track when manifest-id is empty", async () => {
    mockedStorage.getString.mockResolvedValue(null);

    const { user } = render(
      <BackToInternalDomain
        config={{
          screen: ScreenName.Card,
        }}
      />,
    );

    await user.press(screen.getByText("Back"));

    expect(mockedTrack).not.toHaveBeenCalled();
  });
});
