export class StacksMemoTooLong extends Error {
  override name = "StacksMemoTooLong";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "StacksMemoTooLong");
    if (fields) Object.assign(this, fields);
  }
}
