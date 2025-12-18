import React from "react";
import { render, screen } from "@tests/test-renderer";
import CameraPermissions from "../CameraPermissions";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { useIsFocused } from "@react-navigation/native";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: jest.fn(() => true),
}));

describe("CameraPermissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render mount button initially", async () => {
    render(<CameraPermissions />);
    expect(await screen.findByText(/Mount a camera requiring component/i)).toBeTruthy();
  });

  it("should render camera after mounting", async () => {
    const { user } = render(<CameraPermissions />);

    const mountButton = await screen.findByText(/Mount a camera requiring component/i);
    await user.press(mountButton);

    expect(Camera).toHaveBeenCalled();
  });

  it("should show not focused message when screen not in focus", async () => {
    jest.mocked(useIsFocused).mockReturnValue(false);

    const { user } = render(<CameraPermissions />);
    const mountButton = await screen.findByText(/Mount a camera requiring component/i);
    await user.press(mountButton);

    expect(await screen.findByText(/screen not in focus, camera not mounted/i)).toBeTruthy();
  });

  it("should show not focused message when device is null", async () => {
    jest.mocked(useIsFocused).mockReturnValue(true);
    jest.mocked(useCameraDevice).mockReturnValue(undefined);

    const { user } = render(<CameraPermissions />);
    const mountButton = await screen.findByText(/Mount a camera requiring component/i);
    await user.press(mountButton);

    expect(await screen.findByText(/screen not in focus, camera not mounted/i)).toBeTruthy();
  });
});
