/** Same `name` as the host's broadcast error, so apps keep branching on `error.name`. */
export class TransactionBroadcastError extends Error {
  override name = "TransactionBroadcastError";
  coin?: string;
  network?: string;
  url?: string;

  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
