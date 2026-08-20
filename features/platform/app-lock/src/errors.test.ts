import { AppLockError, PasswordNotSet, WrongPassword } from "./errors";

describe("app lock errors", () => {
  it.each([
    [new WrongPassword(), "WrongPassword"],
    [new PasswordNotSet(), "PasswordNotSet"],
  ])("exposes a stable name and a message", (error, name) => {
    expect(error.name).toBe(name);
    expect(error.message).not.toBe("");
  });

  it("groups the family so callers can catch it at once", () => {
    expect(new WrongPassword()).toBeInstanceOf(AppLockError);
    expect(new PasswordNotSet()).toBeInstanceOf(AppLockError);
  });
});
