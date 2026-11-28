import { getAgentIntentPath } from "../getAgentIntentPath";

describe("getAgentIntentPath", () => {
  it.each([
    { source: "nav_bar" as const, path: "/agent-intent?source=nav_bar" },
    { source: "profile" as const, path: "/agent-intent?source=profile" },
  ])("should open Agent Intent with the $source source", ({ source, path }) => {
    expect(getAgentIntentPath(source)).toBe(path);
  });
});
