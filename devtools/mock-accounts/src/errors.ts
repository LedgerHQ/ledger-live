/** A next page asked with a cursor this source never handed out for the account. */
export class MockCursorError extends Error {
  override name = "MockCursorError";
}
