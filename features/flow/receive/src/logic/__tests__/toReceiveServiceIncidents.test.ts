import { toReceiveServiceIncidents } from "../toReceiveServiceIncidents";

describe("toReceiveServiceIncidents", () => {
  it("keeps the incidents on a component, with their latest update", () => {
    expect(
      toReceiveServiceIncidents([
        {
          name: "Tron degraded",
          components: [{ id: "tron" }],
          incident_updates: [{ body: "Investigating" }, { body: "Identified" }],
        },
        { name: "Maintenance", components: [] },
      ]),
    ).toEqual([{ title: "Tron degraded", description: "Investigating" }]);
  });
});
