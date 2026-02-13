import React from "react";
import { Image } from "react-native";
import { render, screen } from "@tests/test-renderer";
import LottieLauncher from "./LottieLauncher";

// lottie-react-native, react-native-config and .lottie files are mocked globally in __tests__/jest-setup.js and jest.config.js

const LOTTIE_MOCK_VALUE = "lottie-test-file-stub";
const mockResolveAssetSource = jest.fn(() => ({
  uri: "file:///splash.lottie",
  width: 1,
  height: 1,
  scale: 1,
}));

let resolveAssetSourceSpy: jest.SpyInstance;
beforeAll(() => {
  resolveAssetSourceSpy = jest
    .spyOn(Image, "resolveAssetSource")
    .mockImplementation(mockResolveAssetSource);
});
afterAll(() => {
  resolveAssetSourceSpy.mockRestore();
});

describe("LottieLauncher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes resolved source (uri) from Image.resolveAssetSource to LottieView", () => {
    render(<LottieLauncher />);
    const sourceEl = screen.getByTestId("lottie-source");
    expect(sourceEl).toBeOnTheScreen();
    const sourceJson = sourceEl.props.children;
    expect(typeof sourceJson).toBe("string");
    expect(sourceJson).toContain("file:///splash.lottie");
    expect(mockResolveAssetSource).toHaveBeenCalledWith(LOTTIE_MOCK_VALUE);
  });

  it("renders an empty container when Image.resolveAssetSource returns null", () => {
    resolveAssetSourceSpy.mockReturnValueOnce(
      null as unknown as ReturnType<typeof Image.resolveAssetSource>,
    );
    render(<LottieLauncher />);
    expect(screen.queryByTestId("lottie-mock")).toBeNull();
  });

  it("renders an empty container when Image.resolveAssetSource returns object without uri", () => {
    resolveAssetSourceSpy.mockReturnValueOnce({
      width: 1,
      height: 1,
      scale: 1,
    } as unknown as ReturnType<typeof Image.resolveAssetSource>);
    render(<LottieLauncher />);
    expect(screen.queryByTestId("lottie-mock")).toBeNull();
  });

  describe("when Config.DETOX is true", () => {
    beforeEach(() => {
      const Config = require("react-native-config").default;
      Config.DETOX = "1";
    });

    afterEach(() => {
      const Config = require("react-native-config").default;
      Config.DETOX = undefined;
    });

    it("renders empty container and does not render LottieView", () => {
      render(<LottieLauncher />);
      expect(screen.getByTestId("lottie-launcher-detox")).toBeOnTheScreen();
      expect(screen.queryByTestId("lottie-mock")).toBeNull();
    });
  });
});
