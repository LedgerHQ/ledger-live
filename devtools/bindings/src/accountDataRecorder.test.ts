import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, fetchAccountData } from "@domain/api-account-data";
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
import { mockAccountAssetBalance } from "@domain/entity-account-balance/schema.mock";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { createAccountDataRecorder } from "./accountDataRecorder";

const descriptor = mockAddressAccountDescriptor();

function setup(read: () => Promise<ReturnType<typeof mockAccountAssetBalance>[]>) {
  const recorder = createAccountDataRecorder({ limit: 10 });
  const store = configureStore({
    reducer: { accountData: accountDataSlice.reducer },
    middleware: getDefault =>
      getDefault({
        thunk: {
          extraArgument: accountDataExtra(
            recorder.instrument([
              {
                id: AccountDataSourceIdSchema.parse("explorer"),
                supports: () => true,
                read: { balance: read },
              },
            ]),
          ),
        },
      }).concat(recorder.middleware),
  });
  return { recorder, store };
}

const types = (recorder: ReturnType<typeof createAccountDataRecorder>) =>
  recorder.getEvents().map(event => event.type);

describe("createAccountDataRecorder", () => {
  it("records a read requested, the source call and its answer", async () => {
    const { recorder, store } = setup(async () => [mockAccountAssetBalance()]);
    await store.dispatch(fetchAccountData("balance", descriptor));
    expect(types(recorder)).toEqual(["requested", "source-call", "received"]);
    expect(recorder.getEvents()[1]).toEqual(
      expect.objectContaining({ sourceId: "explorer", kind: "balance", batch: false, failed: 0 }),
    );
    expect(recorder.getEvents()[2]).toEqual(
      expect.objectContaining({
        sourceId: "explorer",
        hasMore: false,
        elapsedMs: expect.any(Number),
      }),
    );
  });

  it("records a failed read and its failed source call", async () => {
    const { recorder, store } = setup(async () => {
      throw new Error("down");
    });
    await store.dispatch(fetchAccountData("balance", descriptor));
    expect(types(recorder)).toEqual(["requested", "source-call", "failed"]);
    expect(recorder.getEvents()[1]).toEqual(expect.objectContaining({ failed: 1 }));
    expect(recorder.getEvents()[2]).toEqual(expect.objectContaining({ error: "Error: down" }));
  });

  it("keeps the latest events up to its limit, notifies and clears", async () => {
    const { recorder, store } = setup(async () => [mockAccountAssetBalance()]);
    const listener = jest.fn();
    recorder.subscribe(listener);
    for (let i = 0; i < 4; i++) {
      await store.dispatch(fetchAccountData("balance", descriptor, { maxAge: 0 }));
    }
    expect(recorder.getEvents()).toHaveLength(10);
    expect(listener).toHaveBeenCalledTimes(12);
    recorder.clear();
    expect(recorder.getEvents()).toEqual([]);
  });
});
