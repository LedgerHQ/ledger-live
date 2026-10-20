import { copyToClipboard, readClipboard } from "./clipboard.web";

const writeText = jest.fn();
const readText = jest.fn();

describe("clipboard (web)", () => {
  beforeAll(() => {
    Object.assign(navigator, { clipboard: { writeText, readText } });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("copies the text and returns true", async () => {
    writeText.mockResolvedValue(undefined);

    await expect(copyToClipboard("0xabc")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("0xabc");
  });

  it("returns false when the copy is denied", async () => {
    writeText.mockRejectedValue(new DOMException("denied", "NotAllowedError"));

    await expect(copyToClipboard("0xabc")).resolves.toBe(false);
  });

  it("reads the clipboard text", async () => {
    readText.mockResolvedValue("0xabc");

    await expect(readClipboard()).resolves.toBe("0xabc");
  });

  it("returns an empty string when the read is denied", async () => {
    readText.mockRejectedValue(new DOMException("denied", "NotAllowedError"));

    await expect(readClipboard()).resolves.toBe("");
  });
});
