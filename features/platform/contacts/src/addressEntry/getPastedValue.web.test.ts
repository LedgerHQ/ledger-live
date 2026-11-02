import type { ClipboardEvent } from "react";
import { getPastedValue } from "./getPastedValue";

function createClipboardEvent({
  pastedText,
  selectionStart,
  selectionEnd,
  getData = () => pastedText,
}: {
  pastedText: string;
  selectionStart: number | null;
  selectionEnd: number | null;
  getData?: (format: string) => string;
}): ClipboardEvent<HTMLInputElement> {
  return {
    currentTarget: { selectionStart, selectionEnd },
    clipboardData: { getData },
  } as unknown as ClipboardEvent<HTMLInputElement>;
}

describe("getPastedValue", () => {
  it("should insert the pasted text at the caret position", () => {
    const event = createClipboardEvent({ pastedText: "34", selectionStart: 4, selectionEnd: 4 });

    expect(getPastedValue("0x12", event)).toBe("0x1234");
  });

  it("should replace the selected range with the pasted text", () => {
    const event = createClipboardEvent({
      pastedText: "abcd",
      selectionStart: 2,
      selectionEnd: 6,
    });

    expect(getPastedValue("0x1234", event)).toBe("0xabcd");
  });

  it("should append the pasted text when the selection is unavailable", () => {
    const event = createClipboardEvent({
      pastedText: "34",
      selectionStart: null,
      selectionEnd: null,
    });

    expect(getPastedValue("0x12", event)).toBe("0x1234");
  });

  it("should read the clipboard as plain text", () => {
    const getData = jest.fn(() => "34");
    const event = createClipboardEvent({
      pastedText: "34",
      selectionStart: 4,
      selectionEnd: 4,
      getData,
    });

    getPastedValue("0x12", event);

    expect(getData).toHaveBeenCalledWith("text/plain");
  });
});
