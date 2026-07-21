import { ContactIdSchema } from "@domain/entity-contact";
import { getContactInitialAvatarBackground } from "./getContactInitialAvatarBackground";

const contactId = ContactIdSchema.parse("contact-ada");

describe("getContactInitialAvatarBackground", () => {
  it("returns a stable Lumen background token for a contact", () => {
    expect(getContactInitialAvatarBackground(contactId)).toBe(
      getContactInitialAvatarBackground(contactId),
    );
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
    ]).toContain(getContactInitialAvatarBackground(contactId));
  });
});
