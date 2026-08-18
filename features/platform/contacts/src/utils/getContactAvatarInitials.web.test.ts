import { getContactAvatarInitials } from "./getContactAvatarInitials";

describe("getContactAvatarInitials", () => {
  it("returns up to two initials while preserving Unicode combining marks", () => {
    expect(getContactAvatarInitials("Benoit Jean")).toBe("BJ");
    expect(getContactAvatarInitials("élodie Martin")).toBe("ÉM");
    expect(getContactAvatarInitials("Алексей Иванов")).toBe("АИ");
  });

  it("recognizes valid name separators and limits initials to the first two name parts", () => {
    expect(getContactAvatarInitials("  Benoit   Jean  Dupont ")).toBe("BJ");
    expect(getContactAvatarInitials("Jean-Luc Dupont")).toBe("JL");
    expect(getContactAvatarInitials("O'Connor Smith")).toBe("OC");
    expect(getContactAvatarInitials("O’Connor Smith")).toBe("OC");
    expect(getContactAvatarInitials("")).toBe("");
  });
});
