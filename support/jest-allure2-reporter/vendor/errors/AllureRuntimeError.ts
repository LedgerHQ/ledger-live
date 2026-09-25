export class AllureRuntimeError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'AllureRuntimeError';
  }
}
