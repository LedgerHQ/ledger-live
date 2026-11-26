import { defineRecord } from "./defineRecord";
import { NewerRecordVersionError, RecordDecodeError } from "./errors";
import { recordVersions } from "./recordVersions";

type State = { counter: { value: number; transient: string } };

const counterRecord = defineRecord({
  key: "counter",
  versions: recordVersions(z => z.object({ value: z.number() })),
  codec: {
    encode: (counter: State["counter"]) => ({ value: counter.value }),
    decode: stored => ({ value: stored.value, transient: "" }),
  },
  state: {
    select: (state: State) => state.counter,
    toHydrationAction: counter => ({ type: "counter/init", payload: counter }),
  },
});

describe("defineRecord", () => {
  it("should return a frozen value definition with the latest version", () => {
    expect(Object.isFrozen(counterRecord)).toBe(true);
    expect(counterRecord).toMatchObject({ kind: "value", key: "counter", version: 0 });
  });

  it("should select the slice by reference", () => {
    const state: State = { counter: { value: 1, transient: "x" } };
    expect(counterRecord.state.select(state)).toBe(state.counter);
  });

  it("should encode the slice", () => {
    expect(counterRecord.codec.encode({ value: 3, transient: "x" })).toEqual({ value: 3 });
  });

  it("should decode a valid stored value to the slice and give the hydration action", () => {
    const slice = counterRecord.codec.decode({ value: 4 });
    expect(slice).toEqual({ value: 4, transient: "" });
    expect(counterRecord.state.toHydrationAction(slice)).toEqual({
      type: "counter/init",
      payload: { value: 4, transient: "" },
    });
  });

  it("should throw a RecordDecodeError when the stored value is invalid", () => {
    expect(() => counterRecord.codec.decode({ value: "4" })).toThrow(RecordDecodeError);
  });

  it("should throw a NewerRecordVersionError when the stored value is of a newer version", () => {
    expect(() => counterRecord.codec.decode({ $v: 1, data: { value: 4 } })).toThrow(
      NewerRecordVersionError,
    );
  });

  it("should keep the stored value out of the error message when the decode fails", () => {
    const secret = "do-not-log-this";
    const decodeSecret = () => counterRecord.codec.decode({ value: secret });
    expect(decodeSecret).toThrow(expect.objectContaining({ key: "counter", version: 0 }));
    expect(decodeSecret).not.toThrow(secret);
  });
});
