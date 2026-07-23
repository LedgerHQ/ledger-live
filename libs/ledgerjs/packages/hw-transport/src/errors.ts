export class TransportError extends Error {
  override name = "TransportError";
  id: string;
  constructor(message: string, id: string) {
    super(message || "TransportError");
    this.message = message;
    this.stack = new Error(message).stack;
    this.id = id;
  }
}

export class TransportRaceCondition extends Error {
  override name = "TransportRaceCondition";
  constructor(message?: string) {
    super(message || "TransportRaceCondition");
  }
}
