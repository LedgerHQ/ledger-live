export class InvalidAccountDescriptorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAccountDescriptorError";
  }
}
