import { createRef } from "react";
import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";
import { openShareSheet } from "./shareSheet";

jest.mock("react-native-share", () => ({ open: jest.fn(async () => ({ success: true })) }));
jest.mock("react-native-view-shot", () => ({ captureRef: jest.fn() }));

describe("openShareSheet", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shares the message", async () => {
    await openShareSheet({ message: "TXYZ" });

    expect(captureRef).not.toHaveBeenCalled();
    expect(Share.open).toHaveBeenCalledWith({
      url: undefined,
      message: "TXYZ",
      failOnCancel: false,
    });
  });

  it("shares the view as a PNG image with the message", async () => {
    jest.mocked(captureRef).mockResolvedValueOnce("file://card.png");
    const capture = createRef<unknown>();

    await openShareSheet({ message: "TXYZ", capture });

    expect(captureRef).toHaveBeenCalledWith(capture, { format: "png" });
    expect(Share.open).toHaveBeenCalledWith({
      url: "file://card.png",
      message: "TXYZ",
      failOnCancel: false,
    });
  });

  it("resolves when the share sheet fails to open", async () => {
    jest.mocked(Share.open).mockRejectedValueOnce(new Error("no activity"));

    await expect(openShareSheet({ message: "TXYZ" })).resolves.toBeUndefined();
  });

  it("shares the message alone when the view cannot be captured", async () => {
    jest.mocked(captureRef).mockRejectedValueOnce(new Error("capture failed"));

    await openShareSheet({ message: "TXYZ", capture: createRef<unknown>() });

    expect(Share.open).toHaveBeenCalledWith({
      url: undefined,
      message: "TXYZ",
      failOnCancel: false,
    });
  });
});
