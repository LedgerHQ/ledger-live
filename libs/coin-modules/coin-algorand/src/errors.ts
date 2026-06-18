export class AlgorandASANotOptInInRecipient extends Error {
  override name = "AlgorandASANotOptInInRecipient";
  constructor(message = "AlgorandASANotOptInInRecipient") {
    super(message);
  }
}

export class AlgorandMemoExceededSizeError extends Error {
  override name = "AlgorandMemoExceededSizeError";
  constructor(message = "AlgorandMemoExceededSizeError") {
    super(message);
  }
}
