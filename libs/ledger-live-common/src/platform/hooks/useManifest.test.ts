/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";

import { LiveAppManifest } from "../types";
import { useLocalLiveAppManifest } from "../providers/LocalLiveAppProvider";
import { useRemoteLiveAppManifest } from "../providers/RemoteLiveAppProvider";
import { useManifest } from "./useManifest";

jest.mock("../providers/LocalLiveAppProvider");
jest.mock("../providers/RemoteLiveAppProvider");

const mockUseLocalLiveAppManifest = useLocalLiveAppManifest as jest.Mock;
const mockUseRemoteLiveAppManifest = useRemoteLiveAppManifest as jest.Mock;

const mockRemoteManifest = {
  id: "remote-manifest",
} as LiveAppManifest;
const mockLocalManifest = {
  id: "local-manifest",
} as LiveAppManifest;
const mockLiveAppID = "mock-live-app-id";

describe("useManifest hook", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return remoteManifest when it is available", () => {
    mockUseRemoteLiveAppManifest.mockReturnValue(mockRemoteManifest);

    const { result } = renderHook(() => useManifest(mockLiveAppID));

    expect(result.current).toEqual(mockRemoteManifest);
    expect(useRemoteLiveAppManifest).toHaveBeenCalledWith(mockLiveAppID);
  });

  it("should return localManifest when remoteManifest is not available", () => {
    mockUseRemoteLiveAppManifest.mockReturnValue(undefined);
    mockUseLocalLiveAppManifest.mockReturnValue(mockLocalManifest);

    const { result } = renderHook(() => useManifest(mockLiveAppID));

    expect(result.current).toEqual(mockLocalManifest);
    expect(useRemoteLiveAppManifest).toHaveBeenCalledWith(mockLiveAppID);
    expect(useLocalLiveAppManifest).toHaveBeenCalledWith(mockLiveAppID);
  });

  it("should return remoteManifest over localManifest when both are available", () => {
    mockUseLocalLiveAppManifest.mockReturnValue(mockLocalManifest);
    mockUseRemoteLiveAppManifest.mockReturnValue(mockRemoteManifest);

    const { result } = renderHook(() => useManifest(mockLiveAppID));

    expect(result.current).toEqual(mockRemoteManifest);
    expect(useRemoteLiveAppManifest).toHaveBeenCalledWith(mockLiveAppID);
  });

  it("should return undefined when both remoteManifest and localManifest are not available", () => {
    mockUseRemoteLiveAppManifest.mockReturnValue(undefined);
    mockUseLocalLiveAppManifest.mockReturnValue(undefined);

    const { result } = renderHook(() => useManifest(mockLiveAppID));

    expect(result.current).toBeUndefined();
    expect(useRemoteLiveAppManifest).toHaveBeenCalledWith(mockLiveAppID);
    expect(useLocalLiveAppManifest).toHaveBeenCalledWith(mockLiveAppID);
  });
});
