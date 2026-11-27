export class UnknownNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnknownNetworkError";
  }
}
