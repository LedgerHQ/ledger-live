export class IncorrectTypeError extends Error {
  constructor(message?: string) {
    super(`IncorrectType: ${message}`);
  }
}
