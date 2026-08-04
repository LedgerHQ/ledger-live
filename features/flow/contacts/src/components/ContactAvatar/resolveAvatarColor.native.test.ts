import { ContactIdSchema } from "@domain/entity-contact";
import { resolveAvatarColor } from "./resolveAvatarColor";

const contactId = ContactIdSchema.parse("contact-ada");

describe("resolveAvatarColor", () => {
  it("returns a stable Lumen background token for a contact", () => {
    expect(resolveAvatarColor(contactId)).toBe(resolveAvatarColor(contactId));
  });

  it("returns one of the supported avatar colors", () => {
    expect([
      "avatarRed",
      "avatarOrange",
      "avatarYellow",
      "avatarGreen",
      "avatarBlue",
      "avatarPurple",
      "avatarPink",
      "avatarTurquoise",
    ]).toContain(resolveAvatarColor(contactId));
  });
});
