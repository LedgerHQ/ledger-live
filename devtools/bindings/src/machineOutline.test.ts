import { machineOutline } from "./machineOutline";

describe("machineOutline", () => {
  const outline = machineOutline();
  const state = (path: string) => outline.find(row => row.path === path);

  it("starts at the root, which holds the events every state hears", () => {
    expect(outline[0]).toMatchObject({ path: "", depth: 0, kind: "compound" });
    expect(outline[0].transitions).toEqual(
      expect.arrayContaining([{ event: "LOCKED", source: "app", targets: ["deviceLocked"] }]),
    );
  });

  it("lists children under their parent, with the initial one marked", () => {
    const paths = outline.map(row => row.path);

    expect(paths.indexOf("checks.genuineCheck.running")).toBeGreaterThan(
      paths.indexOf("checks.genuineCheck"),
    );
    expect(state("checks.genuineCheck.running")).toMatchObject({ depth: 3, initial: true });
    expect(state("checks.genuineCheck.awaitingApproval")).toMatchObject({ initial: false });
  });

  it("shows the invoked actor, the guards and the final states", () => {
    expect(state("checks.firmwareCheck")?.invokes).toEqual(["firmwareCheck"]);
    expect(state("routing")?.transitions).toContainEqual({
      event: "auto",
      source: "auto",
      targets: ["legacyFallback"],
      guard: "requiresLegacyFlow",
    });
    expect(state("done")?.kind).toBe("final");
  });

  it("says who sends each event: the user, the app or the device", () => {
    const sources = new Map(outline.flatMap(row => row.transitions).map(t => [t.event, t.source]));

    expect(sources.get("RETRY")).toBe("user");
    expect(sources.get("SESSION_READY")).toBe("app");
    expect(sources.get("GENUINE_CHECK_PASSED")).toBe("device");
  });
});
