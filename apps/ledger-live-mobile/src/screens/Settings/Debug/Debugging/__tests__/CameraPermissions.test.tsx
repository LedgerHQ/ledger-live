import React from "react";
import { render, screen } from "@tests/test-renderer";
import CameraPermissions from "../CameraPermissions";
import { Camera } from "react-native-vision-camera";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: jest.fn(() => true),
}));

jest.mock("react-native-vision-camera", () => ({
  Camera: jest.fn(() => null),
  useCameraDevice: jest.fn(() => ({ id: "mock-device", position: "back" })),
}));

jest.mock("~/components/RequiresCameraPermissions", () => {
  return ({ children }: { children: React.ReactNode }) => <>{children}</>;
});

jest.mock("~/components/RequiresCameraPermissions/CameraPermissionContext", () => ({
  Consumer: ({
    children,
  }: {
    children: (value: { permissionGranted: boolean | null }) => React.ReactNode;
  }) => children({ permissionGranted: true }),
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
    const { useIsFocused } = require("@react-navigation/native");
    useIsFocused.mockReturnValue(false);

    const { user } = render(<CameraPermissions />);
    const mountButton = await screen.findByText(/Mount a camera requiring component/i);
    await user.press(mountButton);

    expect(await screen.findByText(/screen not in focus, camera not mounted/i)).toBeTruthy();
  });

  it("should show not focused message when device is null", async () => {
    const { useCameraDevice } = require("react-native-vision-camera");
    const { useIsFocused } = require("@react-navigation/native");
    useIsFocused.mockReturnValue(true);
    useCameraDevice.mockReturnValue(null);

    const { user } = render(<CameraPermissions />);
    const mountButton = await screen.findByText(/Mount a camera requiring component/i);
    await user.press(mountButton);

    expect(await screen.findByText(/screen not in focus, camera not mounted/i)).toBeTruthy();
  });
});
