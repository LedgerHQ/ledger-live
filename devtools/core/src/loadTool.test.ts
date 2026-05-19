import { Category, loadTool, parse } from "./index";
import type { Tool } from "./index";

function makeDescriptor(id: string): Tool {
  return {
    id: parse(id),
    label: id,
    category: Category.CONFIGURATION,
    component: () => null,
  };
}

describe("loadTool", () => {
  it("returns the descriptor on a successful load", async () => {
    const id = parse("good-tool");
    const descriptor = makeDescriptor("good-tool");
    const result = await loadTool(id, async () => ({ default: descriptor }));
    expect(result).toEqual({ id, descriptor });
  });

  it("returns the rejection as an Error in the result", async () => {
    const id = parse("bad-tool");
    const result = await loadTool(id, async () => {
      throw new Error("boom");
    });
    if (!("error" in result)) throw new Error("expected a failure result");
    expect(result.id).toBe(id);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe("boom");
  });

  it("wraps non-Error rejections into Error instances", async () => {
    const id = parse("string-throws");
    const result = await loadTool(id, async () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw "not an error";
    });
    if (!("error" in result)) throw new Error("expected a failure result");
    expect(result.id).toBe(id);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe("not an error");
  });
});
