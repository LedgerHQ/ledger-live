export class AllureReporterError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'AllureReporterError';
  }
}
