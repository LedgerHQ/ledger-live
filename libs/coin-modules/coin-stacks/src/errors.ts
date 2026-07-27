export class StacksMemoTooLong extends Error {
  override name = "StacksMemoTooLong";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "StacksMemoTooLong");
    if (fields) Object.assign(this, fields);
  }
}

export class InvalidNonce extends Error {
  override name = "InvalidNonce";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidNonce");
    if (fields) Object.assign(this, fields);
  }
}
