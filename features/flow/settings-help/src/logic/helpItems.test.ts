import {
  getHelpConfirmationTone,
  getHelpGroups,
  getHelpItemAction,
  HELP_ITEM_IDS,
  isConfirmedHelpItem,
  SHARED_HELP_ITEM_IDS,
  type HelpItemId,
} from "./helpItems";

describe("getHelpGroups", () => {
  it("lists every help item once on desktop, in one group", () => {
    const listed = getHelpGroups("desktop").flatMap(group => group.items);

    expect([...listed].sort()).toEqual([...HELP_ITEM_IDS].sort());
  });

  it("lists only the shared items on mobile", () => {
    const listed = getHelpGroups("mobile").flatMap(group => group.items);

    expect(listed).toEqual([...SHARED_HELP_ITEM_IDS]);
  });

  it.each(["desktop", "mobile"] as const)("puts the support and learning links first on %s", p => {
    expect(getHelpGroups(p)[0]).toEqual({
      id: "supportAndLearning",
      items: ["support", "academy"],
    });
  });

  it("ends the desktop More group with the reset, the destructive item", () => {
    expect(getHelpGroups("desktop")[1]?.items.at(-1)).toBe("resetApp");
  });
});

describe("getHelpItemAction", () => {
  it("opens a link for the external rows", () => {
    expect(HELP_ITEM_IDS.filter(id => getHelpItemAction(id, "desktop") === "external")).toEqual([
      "support",
      "academy",
      "status",
    ]);
  });

  it("leaves the save logs and repair rows to the desktop app", () => {
    expect(HELP_ITEM_IDS.filter(id => getHelpItemAction(id, "desktop") === "slot")).toEqual([
      "saveLogs",
      "repairDevice",
    ]);
  });

  it("saves the logs through the port on mobile", () => {
    expect(getHelpItemAction("saveLogs", "mobile")).toBe("button");
  });
});

describe("isConfirmedHelpItem", () => {
  it.each<[HelpItemId, boolean]>([
    ["clearCache", true],
    ["resetApp", true],
    ["viewUserData", false],
    ["support", false],
  ])("is %s confirmed: %s", (id, expected) => {
    expect(isConfirmedHelpItem(id)).toBe(expected);
  });
});

describe("getHelpConfirmationTone", () => {
  it("asks to clear the cache as an information on mobile only", () => {
    expect(getHelpConfirmationTone("clearCache", "mobile")).toBe("neutral");
    expect(getHelpConfirmationTone("clearCache", "desktop")).toBe("destructive");
    expect(getHelpConfirmationTone("resetApp", "desktop")).toBe("destructive");
  });
});
