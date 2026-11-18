/** A next page asked with a cursor this source never handed out for the account. */
export class MockCursorError extends Error {
  override name = "MockCursorError";
}

/** An `assetStatus` read without the asset it asks about. */
export class MockAssetStatusQueryError extends Error {
  override name = "MockAssetStatusQueryError";
}
