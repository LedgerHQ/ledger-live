/*
 * When the transferID/Memo is non number
 */
export class InvalidMemoICP extends Error {
  override name = "InvalidMemoICP";
  constructor(message?: string) {
    super(message || "InvalidMemoICP");
  }
}
