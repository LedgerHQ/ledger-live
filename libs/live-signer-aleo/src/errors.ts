export class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
  constructor(message?: string) {
    super(message || "UserRefusedOnDevice");
  }
}
