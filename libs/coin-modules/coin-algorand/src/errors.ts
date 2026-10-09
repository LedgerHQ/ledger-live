export class AlgorandASANotOptInInRecipient extends Error {
  override name = "AlgorandASANotOptInInRecipient";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AlgorandASANotOptInInRecipient");
    if (fields) Object.assign(this, fields);
  }
}

export class AlgorandMemoExceededSizeError extends Error {
  override name = "AlgorandMemoExceededSizeError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AlgorandMemoExceededSizeError");
    if (fields) Object.assign(this, fields);
  }
}
