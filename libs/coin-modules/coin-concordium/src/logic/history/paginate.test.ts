import type { RawOperation } from "../../types";
import type { RawOperationPage } from "./listOperations";
import { paginateOperations } from "./paginate";

const op = (hash: string): RawOperation =>
  ({ hash, type: "OUT", value: "1", fee: "0" }) as unknown as RawOperation;

const page = (items: RawOperation[], next?: string): RawOperationPage => ({ items, next });

describe("paginateOperations", () => {
  it("follows the cursor until a page offers none", async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(page([op("a")], "1"))
      .mockResolvedValueOnce(page([op("b")], "2"))
      .mockResolvedValueOnce(page([op("c")]));

    expect((await paginateOperations(fetchPage)).map(o => o.hash)).toEqual(["a", "b", "c"]);
    expect(fetchPage).toHaveBeenNthCalledWith(1, undefined);
    expect(fetchPage).toHaveBeenNthCalledWith(3, "2");
  });

  it("treats an empty cursor as the end, since that is how it can arrive", async () => {
    const fetchPage = jest.fn().mockResolvedValue(page([op("a")], ""));

    expect(await paginateOperations(fetchPage)).toHaveLength(1);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("keeps going past a page that parsed to nothing, since older rows remain", async () => {
    // Whole pages parse away: this family keeps three transaction types out of
    // dozens, so contract calls or delegation updates fill a page with nothing.
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(page([], "1"))
      .mockResolvedValueOnce(page([op("a")]));

    expect((await paginateOperations(fetchPage)).map(o => o.hash)).toEqual(["a"]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("reports a replayed cursor rather than returning the fragment it gathered", async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(page([op("a")], "1"))
      .mockResolvedValueOnce(page([op("b")], "2"))
      .mockResolvedValue(page([op("c")], "1"));

    await expect(paginateOperations(fetchPage)).rejects.toThrow("was served twice");
  });

  it("reports a failed page rather than the operations gathered before it", async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(page([op("a")], "1"))
      .mockRejectedValueOnce(new Error("network error"));

    await expect(paginateOperations(fetchPage)).rejects.toThrow("network error");
  });
});
