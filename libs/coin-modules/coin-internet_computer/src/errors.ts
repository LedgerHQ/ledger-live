/*
 * When the transferID/Memo is non number
 */
export class InvalidMemoICP extends Error {
  override name = "InvalidMemoICP";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidMemoICP");
    if (fields) Object.assign(this, fields);
  }
}
