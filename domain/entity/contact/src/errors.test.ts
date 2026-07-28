import { InvalidContactNameError, INVALID_CONTACT_NAME_ERROR_NAME } from "./errors";

describe("errors", () => {
  it("InvalidContactNameError extends Error and keeps the stable name", () => {
    const error = new InvalidContactNameError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(INVALID_CONTACT_NAME_ERROR_NAME);
  });
});
