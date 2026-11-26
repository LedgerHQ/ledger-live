import {
  HELP_GROUPS,
  HELP_ITEM_ACTIONS,
  HELP_ITEM_IDS,
  isConfirmedHelpItem,
  type HelpItemId,
} from "./helpItems";

describe("HELP_GROUPS", () => {
  it("lists every help item once, in one group", () => {
    const listed = HELP_GROUPS.flatMap(group => group.items);

    expect([...listed].sort()).toEqual([...HELP_ITEM_IDS].sort());
  });

  it("puts the support and learning links first", () => {
    expect(HELP_GROUPS[0]).toEqual({ id: "supportAndLearning", items: ["support", "academy"] });
  });

  it("ends the More group with the reset, the destructive item", () => {
    expect(HELP_GROUPS[1]?.items.at(-1)).toBe("resetApp");
  });
});

describe("HELP_ITEM_ACTIONS", () => {
  it("opens a link for the external rows", () => {
    expect(HELP_ITEM_IDS.filter(id => HELP_ITEM_ACTIONS[id] === "external")).toEqual([
      "support",
      "academy",
      "status",
    ]);
  });

  it("leaves the save logs and repair rows to the app", () => {
    expect(HELP_ITEM_IDS.filter(id => HELP_ITEM_ACTIONS[id] === "slot")).toEqual([
      "saveLogs",
      "repairDevice",
    ]);
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
