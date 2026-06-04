import { Platform, TurboModuleRegistry } from "react-native";
import {
  consumeStashedDebugLottiePick,
  InvalidLottieExtensionError,
  pickLocalLottieFile,
  stashDebugLottiePick,
} from "../pickLocalLottieFile";

const mockPick = jest.fn();
const mockKeepLocalCopy = jest.fn();
const mockGetDocumentPicker = jest.fn();
const mockExists = jest.fn();
const mockUnlink = jest.fn();
const mockFetch = jest.fn();
const originalPlatformOs = Platform.OS;
let turboModuleGetSpy: jest.SpiedFunction<typeof TurboModuleRegistry.get>;

jest.mock("rn-fetch-blob", () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { DocumentDir: "/mock/documents" },
      exists: (...args: unknown[]) => mockExists(...args),
      unlink: (...args: unknown[]) => mockUnlink(...args),
    },
    config: jest.fn(() => ({
      fetch: (...args: unknown[]) => mockFetch(...args),
    })),
  },
}));

jest.mock("../documentPickerBridge", () => ({
  getDocumentPicker: (...args: unknown[]) => mockGetDocumentPicker(...args),
  isDocumentPickerCancelled: (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "OPERATION_CANCELED",
}));

describe("pickLocalLottieFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "ios";
    consumeStashedDebugLottiePick();
    turboModuleGetSpy = jest.spyOn(TurboModuleRegistry, "get").mockReturnValue({} as never);
    mockGetDocumentPicker.mockReturnValue({
      pick: mockPick,
      keepLocalCopy: mockKeepLocalCopy,
      types: { allFiles: "*/*" },
      isErrorWithCode: (error: unknown) =>
        typeof error === "object" && error !== null && "code" in error,
      errorCodes: {
        OPERATION_CANCELED: "OPERATION_CANCELED",
      },
    });
  });

  afterEach(() => {
    Platform.OS = originalPlatformOs;
    turboModuleGetSpy.mockRestore();
  });

  it("returns null when the picker is cancelled", async () => {
    mockPick.mockRejectedValue({ code: "OPERATION_CANCELED" });

    await expect(pickLocalLottieFile()).resolves.toBeNull();
    expect(mockPick).toHaveBeenCalledWith({
      mode: "import",
      type: ["*/*"],
      allowMultiSelection: false,
    });
  });

  it("uses the picked file URI directly on iOS when it is already file://", async () => {
    mockPick.mockResolvedValue([
      {
        uri: "file:///picked/animation.lottie",
        name: "animation.lottie",
      },
    ]);

    await expect(pickLocalLottieFile()).resolves.toEqual({
      uri: "file:///picked/animation.lottie",
      name: "animation.lottie",
    });
    expect(mockKeepLocalCopy).not.toHaveBeenCalled();
  });

  it("normalizes file URIs with spaces for native playback", async () => {
    mockPick.mockResolvedValue([
      {
        uri: "file:///picked/my animation.lottie",
        name: "animation.lottie",
      },
    ]);

    await expect(pickLocalLottieFile()).resolves.toEqual({
      uri: "file:///picked/my%20animation.lottie",
      name: "animation.lottie",
    });
  });

  it("uses a lowercase .lottie file name when copying on Android", async () => {
    Platform.OS = "android";
    mockPick.mockResolvedValue([
      {
        uri: "content://downloads/Animation.Lottie",
        name: "Animation.Lottie",
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      {
        status: "success",
        localUri: "file:///data/user/0/Animation.lottie",
      },
    ]);

    await expect(pickLocalLottieFile()).resolves.toEqual({
      uri: "file:///data/user/0/Animation.lottie",
      name: "Animation.lottie",
    });
    expect(mockKeepLocalCopy).toHaveBeenCalledWith({
      files: [{ uri: "content://downloads/Animation.Lottie", fileName: "Animation.lottie" }],
      destination: "documentDirectory",
    });
  });

  it("throws when the picker returns no files", async () => {
    mockPick.mockResolvedValue([]);

    await expect(pickLocalLottieFile()).rejects.toThrow(/without returning a file/i);
  });

  it("throws when the picker response contains an error", async () => {
    mockPick.mockResolvedValue([
      {
        uri: "file:///picked/animation.lottie",
        name: "animation.lottie",
        error: "Could not read file metadata",
      },
    ]);

    await expect(pickLocalLottieFile()).rejects.toThrow("Could not read file metadata");
  });

  it("accepts a .lottie file when the name is only present in the uri", async () => {
    mockPick.mockResolvedValue([
      {
        uri: "file:///picked/my-animation.lottie",
        name: null,
      },
    ]);

    await expect(pickLocalLottieFile()).resolves.toEqual({
      uri: "file:///picked/my-animation.lottie",
      name: "my-animation.lottie",
    });
    expect(mockKeepLocalCopy).not.toHaveBeenCalled();
  });

  it("accepts a single-object picker response", async () => {
    mockPick.mockResolvedValue({
      uri: "file:///picked/animation.lottie",
      name: "animation.lottie",
    });

    await expect(pickLocalLottieFile()).resolves.toEqual({
      uri: "file:///picked/animation.lottie",
      name: "animation.lottie",
    });
  });

  it("copies the picked file locally on Android", async () => {
    Platform.OS = "android";
    mockPick.mockResolvedValue([
      {
        uri: "content://downloads/animation.lottie",
        name: "animation.lottie",
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      {
        status: "success",
        localUri: "file:///data/user/0/animation.lottie",
      },
    ]);

    await expect(pickLocalLottieFile()).resolves.toEqual({
      uri: "file:///data/user/0/animation.lottie",
      name: "animation.lottie",
    });
    expect(mockPick).toHaveBeenCalledWith({
      mode: "open",
      requestLongTermAccess: false,
      type: ["*/*"],
      allowMultiSelection: false,
    });
    expect(mockKeepLocalCopy).toHaveBeenCalledWith({
      files: [{ uri: "content://downloads/animation.lottie", fileName: "animation.lottie" }],
      destination: "documentDirectory",
    });
  });

  it("copies virtual files on Android with a conversion mime type", async () => {
    Platform.OS = "android";
    mockPick.mockResolvedValue([
      {
        uri: "content://downloads/animation.lottie",
        name: "animation.lottie",
        isVirtual: true,
        convertibleToMimeTypes: [{ mimeType: "application/zip" }],
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      {
        status: "success",
        localUri: "file:///data/user/0/animation.lottie",
      },
    ]);

    await expect(pickLocalLottieFile()).resolves.toEqual({
      uri: "file:///data/user/0/animation.lottie",
      name: "animation.lottie",
    });
    expect(mockKeepLocalCopy).toHaveBeenCalledWith({
      files: [
        {
          uri: "content://downloads/animation.lottie",
          fileName: "animation.lottie",
          convertVirtualFileToType: "application/zip",
        },
      ],
      destination: "documentDirectory",
    });
  });

  it("copies non-file uris on iOS", async () => {
    mockPick.mockResolvedValue([
      {
        uri: "ph://asset-id/my-animation.lottie",
        name: "my-animation.lottie",
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      {
        status: "success",
        localUri: "file:///var/mobile/Containers/my-animation.lottie",
      },
    ]);

    await expect(pickLocalLottieFile()).resolves.toEqual({
      uri: "file:///var/mobile/Containers/my-animation.lottie",
      name: "my-animation.lottie",
    });
    expect(mockKeepLocalCopy).toHaveBeenCalled();
  });

  it("throws when the selected file is not a .lottie file", async () => {
    mockPick.mockResolvedValue([
      {
        uri: "file:///picked/animation.json",
        name: "animation.json",
      },
    ]);

    await expect(pickLocalLottieFile()).rejects.toBeInstanceOf(InvalidLottieExtensionError);
  });

  it("rejects files that only contain .lottie as a substring", async () => {
    mockPick.mockResolvedValue([
      {
        uri: "file:///picked/animation.lottie.json",
        name: "animation.lottie.json",
      },
    ]);

    await expect(pickLocalLottieFile()).rejects.toBeInstanceOf(InvalidLottieExtensionError);
  });

  it("prefers the uri basename when the display name lacks a .lottie extension", async () => {
    Platform.OS = "android";
    mockPick.mockResolvedValue([
      {
        uri: "content://downloads/animation.lottie",
        name: "Animation",
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      {
        status: "success",
        localUri: "file:///data/user/0/animation.lottie",
      },
    ]);

    await expect(pickLocalLottieFile()).resolves.toEqual({
      uri: "file:///data/user/0/animation.lottie",
      name: "animation.lottie",
    });
  });

  it("wraps document picker module load errors with a rebuild hint", async () => {
    mockGetDocumentPicker.mockImplementation(() => {
      throw new Error("Document picker module failed to load");
    });

    await expect(pickLocalLottieFile()).rejects.toThrow(/Rebuild the native app/i);
  });

  it("throws when the native module is not linked", async () => {
    turboModuleGetSpy.mockReturnValue(null);

    await expect(pickLocalLottieFile()).rejects.toThrow(/Rebuild the native app/i);
    expect(mockPick).not.toHaveBeenCalled();
  });

  it("wraps native module errors with a rebuild hint", async () => {
    mockPick.mockRejectedValue(
      new Error("TurboModuleRegistry.getEnforcing(...): 'RNDocumentPicker' could not be found"),
    );

    await expect(pickLocalLottieFile()).rejects.toThrow(/Rebuild the native app/i);
  });

  it("stores and consumes stashed picks", () => {
    expect(consumeStashedDebugLottiePick()).toBeNull();

    stashDebugLottiePick({
      uri: "file:///picked/animation.lottie",
      name: "animation.lottie",
    });

    expect(consumeStashedDebugLottiePick()).toEqual({
      uri: "file:///picked/animation.lottie",
      name: "animation.lottie",
    });
    expect(consumeStashedDebugLottiePick()).toBeNull();
  });

  it("throws when the picker returns an invalid document shape", async () => {
    mockPick.mockResolvedValue([{ name: "animation.lottie" }]);

    await expect(pickLocalLottieFile()).rejects.toThrow(/has no URI/i);
  });

  it("throws when keepLocalCopy fails without an error message", async () => {
    mockPick.mockResolvedValue([
      {
        uri: "ph://asset-id/animation.lottie",
        name: "animation.lottie",
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([{ status: "failed" }]);

    await expect(pickLocalLottieFile()).rejects.toThrow("Failed to copy picked file locally");
  });

  it("throws when keepLocalCopy succeeds without a local uri", async () => {
    mockPick.mockResolvedValue([
      {
        uri: "ph://asset-id/animation.lottie",
        name: "animation.lottie",
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([{ status: "success", localUri: "  " }]);

    await expect(pickLocalLottieFile()).rejects.toThrow("Copied file has no local URI");
  });

  it("falls back to rn-fetch-blob on Android when keepLocalCopy fails", async () => {
    Platform.OS = "android";
    mockPick.mockResolvedValue([
      {
        uri: "content://downloads/animation.lottie",
        name: "animation.lottie",
      },
    ]);
    mockKeepLocalCopy.mockResolvedValue([
      { status: "error", copyError: "copy failed" },
    ]);
    mockExists.mockResolvedValue(true);
    mockUnlink.mockResolvedValue(undefined);
    mockFetch.mockResolvedValue(undefined);

    await expect(pickLocalLottieFile()).resolves.toEqual({
      uri: "file:///mock/documents/animation.lottie",
      name: "animation.lottie",
    });
    expect(mockUnlink).toHaveBeenCalledWith("/mock/documents/animation.lottie");
    expect(mockFetch).toHaveBeenCalledWith("GET", "content://downloads/animation.lottie");
  });

  it("uses a string rejection as the error message", async () => {
    mockPick.mockRejectedValue("network down");

    await expect(pickLocalLottieFile()).rejects.toThrow("network down");
  });
});
