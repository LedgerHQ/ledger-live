import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { descriptorOf } from "@domain/api-account-data/testing";
import { summarizeStatuses } from "./summarizeStatuses";

const uuids = [0, 1, 2].map(i => computeAccountUUID(descriptorOf(i)));
const down = { name: "RangeError", message: "down" };

describe("summarizeStatuses", () => {
  it("is idle with no error when nothing was read", () => {
    expect(summarizeStatuses(uuids, [undefined, undefined, undefined])).toEqual({
      errors: [],
      pending: false,
    });
  });

  it("lists the failed accounts only, in order", () => {
    const { errors } = summarizeStatuses(uuids, [{}, { error: down }, {}]);
    expect(errors).toEqual([{ accountUUID: uuids[1], error: down }]);
  });

  it("is pending on a head read, not on a next page", () => {
    const head = { request: { id: "h", append: false } };
    const page = { request: { id: "p", append: true } };
    expect(summarizeStatuses(uuids, [page, {}, {}]).pending).toBe(false);
    expect(summarizeStatuses(uuids, [page, head, {}]).pending).toBe(true);
  });
});
