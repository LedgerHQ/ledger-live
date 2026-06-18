export class StacksMemoTooLong extends Error {
  override name = "StacksMemoTooLong";
  constructor(message = "StacksMemoTooLong") {
    super(message);
  }
}
