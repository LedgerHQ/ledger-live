import { getContactAvatarColorClass } from "./getContactAvatarColorClass";

const ContactAvatarColorClasses = [
  "bg-accent text-on-accent",
  "bg-active-subtle text-active",
  "bg-interactive text-on-interactive",
  "bg-success-transparent text-success",
  "bg-warning-transparent text-warning",
] as const;

describe("getContactAvatarColorClass", () => {
  it("returns a deterministic color class for a contact id", () => {
    expect(getContactAvatarColorClass("contact-ada")).toBe("bg-interactive text-on-interactive");
    expect(getContactAvatarColorClass("contact-ada")).toBe(getContactAvatarColorClass("contact-ada"));
  });

  it("returns one of the avatar color classes", () => {
    expect(ContactAvatarColorClasses).toContain(getContactAvatarColorClass("contact-ben"));
    expect(ContactAvatarColorClasses).toContain(getContactAvatarColorClass("contact-olive"));
  });

  it("returns the first color class for an empty contact id", () => {
    expect(getContactAvatarColorClass("")).toBe("bg-accent text-on-accent");
  });
});
