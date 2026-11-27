import { z } from "zod";
import { parseEach } from "./parseEach";

const ItemSchema = z.object({ id: z.string(), count: z.int() });

describe("parseEach", () => {
  it("should keep the items that pass and report the others with their id", () => {
    expect(
      parseEach(
        ItemSchema,
        [
          { id: "a", count: 1 },
          { id: "b", count: "2" },
          { id: "c", count: 3 },
        ],
        "id",
      ),
    ).toEqual({
      records: [
        { id: "a", count: 1 },
        { id: "c", count: 3 },
      ],
      unreadable: [{ id: "b", issues: expect.stringContaining("count") }],
    });
  });

  it("should report an item without a readable id without one", () => {
    expect(parseEach(ItemSchema, [null, { id: 7 }], "id").unreadable).toEqual([
      { issues: expect.any(String) },
      { issues: expect.any(String) },
    ]);
  });
});
