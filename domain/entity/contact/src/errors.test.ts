import {
  ContactAddressLabelTooLongError,
  DuplicateContactAddressLabelError,
  InvalidContactAddressLabelError,
  InvalidContactNameError,
} from "./errors";

describe("errors", () => {
  it.each([
    [new InvalidContactNameError(), "InvalidContactNameError"],
    [new InvalidContactAddressLabelError(), "InvalidContactAddressLabelError"],
    [
      new DuplicateContactAddressLabelError(),
      "DuplicateContactAddressLabelError",
    ],
    [new ContactAddressLabelTooLongError(), "ContactAddressLabelTooLongError"],
  ])("%s extends Error and keeps the stable name", (error, name) => {
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(name);
  });
});
