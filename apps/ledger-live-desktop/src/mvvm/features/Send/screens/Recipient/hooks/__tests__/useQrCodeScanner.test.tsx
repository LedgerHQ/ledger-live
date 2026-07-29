import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "tests/testSetup";
import { NoAccessToCamera } from "@ledgerhq/live-common/errors";
import jsQR from "jsqr";
import { useQrCodeScanner } from "../useQrCodeScanner";

jest.mock("jsqr", () => ({ __esModule: true, default: jest.fn() }));

const DECODE_INTERVAL_MS = 400;
const CAMERA_TIMEOUT_MS = 20000;

type VM = ReturnType<typeof useQrCodeScanner>;

let container: HTMLElement;
let root: ReturnType<typeof createRoot>;
let latestVM: VM | null = null;

function HookProbe({ onPick }: { onPick: (code: string) => void }) {
  const vm = useQrCodeScanner({ onPick });
  latestVM = vm;
  return <video ref={vm.videoRef} />;
}

const createTrack = () => ({ stop: jest.fn() });

const mockStream = (tracks = [createTrack()]) =>
  ({ getTracks: () => tracks }) as unknown as MediaStream;

const setMediaDevices = (getUserMedia: jest.Mock | null) => {
  Object.defineProperty(navigator, "mediaDevices", {
    value: getUserMedia ? { getUserMedia } : undefined,
    configurable: true,
    writable: true,
  });
};

/** Gives the video element the dimensions and readiness jsdom never computes on its own */
const giveVideoDimensions = (width = 640, height = 480) => {
  const video = container.querySelector("video") as HTMLVideoElement;
  Object.defineProperty(video, "videoWidth", { value: width, configurable: true });
  Object.defineProperty(video, "videoHeight", { value: height, configurable: true });
  Object.defineProperty(video, "readyState", {
    value: HTMLMediaElement.HAVE_ENOUGH_DATA,
    configurable: true,
  });
  video.play = jest.fn().mockResolvedValue(undefined);
  video.pause = jest.fn();
  return video;
};

/** Mounts without flushing, so the video can be prepared before getUserMedia resolves */
function renderHook(onPick: (code: string) => void) {
  act(() => {
    root.render(<HookProbe onPick={onPick} />);
  });
}

async function flushCameraStart() {
  await act(async () => {});
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  latestVM = null;
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  jest.useRealTimers();
});

describe("useQrCodeScanner", () => {
  it("starts loading, then streams and clears the loading state", async () => {
    setMediaDevices(jest.fn().mockResolvedValue(mockStream()));

    renderHook(jest.fn());
    giveVideoDimensions();
    await flushCameraStart();

    expect(latestVM?.isLoading).toBe(false);
    expect(latestVM?.error).toBeNull();
  });

  it("calls onPick with the decoded data once a frame contains a QR code", async () => {
    setMediaDevices(jest.fn().mockResolvedValue(mockStream()));
    const onPick = jest.fn();
    (jsQR as jest.Mock).mockReturnValue({ data: "ethereum:0xAbC" });

    renderHook(onPick);
    giveVideoDimensions();
    await flushCameraStart();

    await act(async () => {
      jest.advanceTimersByTime(DECODE_INTERVAL_MS);
    });

    expect(onPick).toHaveBeenCalledWith("ethereum:0xAbC");
  });

  it("does not call onPick while no QR code is decoded", async () => {
    setMediaDevices(jest.fn().mockResolvedValue(mockStream()));
    const onPick = jest.fn();
    (jsQR as jest.Mock).mockReturnValue(null);

    renderHook(onPick);
    giveVideoDimensions();
    await flushCameraStart();

    await act(async () => {
      jest.advanceTimersByTime(DECODE_INTERVAL_MS * 4);
    });

    expect(jsQR).toHaveBeenCalled();
    expect(onPick).not.toHaveBeenCalled();
  });

  it("decodes a downscaled frame instead of the camera's native resolution", async () => {
    setMediaDevices(jest.fn().mockResolvedValue(mockStream()));
    (jsQR as jest.Mock).mockReturnValue(null);

    renderHook(jest.fn());
    giveVideoDimensions(1920, 1080);
    await flushCameraStart();

    await act(async () => {
      jest.advanceTimersByTime(DECODE_INTERVAL_MS);
    });

    expect(jsQR).toHaveBeenCalledWith(expect.anything(), 640, 360);
  });

  it("skips the frame while the video has no current data", async () => {
    setMediaDevices(jest.fn().mockResolvedValue(mockStream()));

    renderHook(jest.fn());
    const video = giveVideoDimensions();
    Object.defineProperty(video, "readyState", {
      value: HTMLMediaElement.HAVE_METADATA,
      configurable: true,
    });
    await flushCameraStart();

    await act(async () => {
      jest.advanceTimersByTime(DECODE_INTERVAL_MS * 2);
    });

    expect(jsQR).not.toHaveBeenCalled();
  });

  it("surfaces NoAccessToCamera when the video fails to play", async () => {
    setMediaDevices(jest.fn().mockResolvedValue(mockStream()));

    renderHook(jest.fn());
    const video = giveVideoDimensions();
    video.play = jest.fn().mockRejectedValue(new Error("play interrupted"));
    await flushCameraStart();

    expect(latestVM?.error).toBeInstanceOf(NoAccessToCamera);
    expect(latestVM?.isLoading).toBe(false);
    expect(jsQR).not.toHaveBeenCalled();
  });

  it("surfaces NoAccessToCamera when the permission is denied", async () => {
    setMediaDevices(jest.fn().mockRejectedValue(new Error("Permission denied")));

    renderHook(jest.fn());
    await flushCameraStart();

    expect(latestVM?.error).toBeInstanceOf(NoAccessToCamera);
    expect(latestVM?.isLoading).toBe(false);
  });

  it("surfaces NoAccessToCamera when mediaDevices is unavailable", async () => {
    setMediaDevices(null);

    renderHook(jest.fn());
    await flushCameraStart();

    expect(latestVM?.error).toBeInstanceOf(NoAccessToCamera);
  });

  it("surfaces NoAccessToCamera when the permission prompt never settles", async () => {
    setMediaDevices(jest.fn().mockReturnValue(new Promise(() => {})));

    renderHook(jest.fn());
    await act(async () => {
      jest.advanceTimersByTime(CAMERA_TIMEOUT_MS);
    });

    expect(latestVM?.error).toBeInstanceOf(NoAccessToCamera);
  });

  it("stops the camera tracks and the decode loop on unmount", async () => {
    const track = createTrack();
    setMediaDevices(jest.fn().mockResolvedValue(mockStream([track])));
    const onPick = jest.fn();
    (jsQR as jest.Mock).mockReturnValue({ data: "0xAbC" });

    renderHook(onPick);
    giveVideoDimensions();
    await flushCameraStart();

    act(() => {
      root.unmount();
    });

    expect(track.stop).toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(DECODE_INTERVAL_MS * 4);
    });

    expect(onPick).not.toHaveBeenCalled();
  });
});
