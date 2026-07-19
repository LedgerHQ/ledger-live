export class StacksMemoTooLong extends Error {
  override name = "StacksMemoTooLong";
  constructor(message?: string) {
    super(message || "StacksMemoTooLong");
  }
}

export class InvalidNonce extends Error {
  override name = "InvalidNonce";
  constructor(message?: string) {
    super(message || "InvalidNonce");
  }
}
