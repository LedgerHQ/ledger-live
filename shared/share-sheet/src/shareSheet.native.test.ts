import { createRef } from "react";
import type { View } from "react-native";
import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";
import { captureView, openShareSheet } from "./shareSheet";

jest.mock("react-native-share", () => ({ open: jest.fn(async () => ({ success: true })) }));
jest.mock("react-native-view-shot", () => ({ captureRef: jest.fn() }));

describe("captureView", () => {
  it("captures the view as a PNG image", async () => {
    jest.mocked(captureRef).mockResolvedValueOnce("file://card.png");
    const view = createRef<View>();

    await expect(captureView(view)).resolves.toBe("file://card.png");
    expect(captureRef).toHaveBeenCalledWith(view, { format: "png" });
  });

  it("resolves without an image when the view cannot be captured", async () => {
    jest.mocked(captureRef).mockRejectedValueOnce(new Error("capture failed"));

    await expect(captureView(createRef<View>())).resolves.toBeUndefined();
  });
});

describe("openShareSheet", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shares the message", async () => {
    await openShareSheet({ message: "TXYZ" });

    expect(Share.open).toHaveBeenCalledWith({
      url: undefined,
      message: "TXYZ",
      failOnCancel: false,
    });
  });

  it("shares the image with the message", async () => {
    await openShareSheet({ message: "TXYZ", imageUrl: "file://card.png" });

    expect(Share.open).toHaveBeenCalledWith({
      url: "file://card.png",
      message: "TXYZ",
      failOnCancel: false,
    });
  });

  it("rejects when the share sheet cannot open", async () => {
    jest.mocked(Share.open).mockRejectedValueOnce(new Error("no activity"));

    await expect(openShareSheet({ message: "TXYZ" })).rejects.toThrow("no activity");
  });
});
