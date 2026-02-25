import { MAX_COMMENT_BYTES } from "../constants";
import { TonComment } from "../types";
import { validateMemo } from "./validateMemo";

describe("validateMemo", () => {
  it("should return true when comment is encrypted", () => {
    const comment: TonComment = {
      isEncrypted: true,
      text: "",
    };

    expect(validateMemo(comment)).toEqual(true);
  });

  it.each(["a".repeat(MAX_COMMENT_BYTES + 1), "a".repeat(MAX_COMMENT_BYTES + 2)])(
    "should return false when comment is not encrypted and comment text exceeds maximum allowed size",
    (text: string) => {
      const comment: TonComment = {
        isEncrypted: false,
        text,
      };
      expect(validateMemo(comment)).toEqual(false);
    },
  );

  it.each(["😀", "café", "Hello\nWorld"])(
    "should return false when comment is not encrypted and comment text has a correct size but contains non alphanumeric characters nor common punctuation",
    (text: string) => {
      const comment: TonComment = {
        isEncrypted: false,
        text,
      };
      expect(validateMemo(comment)).toEqual(false);
    },
  );

  it.each([
    "a",
    "Hello World",
    "It is a comment.",
    "Hi, there",
    "1",
    "123",
    "123.456",
    "Hello123World",
  ])(
    "should return true when comment is not encrypted, comment text has a correct size and contains only alphanumeric characters or common punctuation",
    (text: string) => {
      const comment: TonComment = {
        isEncrypted: false,
        text,
      };
      expect(validateMemo(comment)).toEqual(true);
    },
  );
});
