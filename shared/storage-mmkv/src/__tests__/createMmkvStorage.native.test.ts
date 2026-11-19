import { describeListableStorageContract, describeStorageContract } from "@shared/storage/testing";
import { createMMKV } from "react-native-mmkv";
import { createMmkvStorage } from "../createMmkvStorage";

jest.mock("react-native-mmkv", () => {
  const instances = new Map<string, Map<string, string>>();
  return {
    createMMKV: jest.fn(({ id }: { id: string }) => {
      const values = new Map<string, string>();
      instances.set(id, values);
      return {
        getString: (key: string) => values.get(key),
        set: (key: string, value: string) => values.set(key, value),
        remove: (key: string) => values.delete(key),
        getAllKeys: () => [...values.keys()],
      };
    }),
  };
});

describeStorageContract("mmkv", () => createMmkvStorage());
describeListableStorageContract("mmkv", () => createMmkvStorage());

describe("createMmkvStorage", () => {
  it("opens the ledger-live instance by default, as the legacy wrapper does", () => {
    createMmkvStorage();
    expect(createMMKV).toHaveBeenLastCalledWith({ id: "ledger-live" });
  });

  it("stores the JSON string, as the legacy wrapper does", async () => {
    const storage = createMmkvStorage({ id: "json" });
    const mmkv = jest.mocked(createMMKV).mock.results.at(-1)!.value;

    await storage.set("history", { lastSeenOperationDate: null });

    expect(mmkv.getString("history")).toBe('{"lastSeenOperationDate":null}');
  });

  it("writes to the engine before set resolves, as MMKV is synchronous", () => {
    const storage = createMmkvStorage({ id: "sync" });
    const mmkv = jest.mocked(createMMKV).mock.results.at(-1)!.value;

    void storage.set("history", { lastSeenOperationDate: null });

    expect(mmkv.getString("history")).toBe('{"lastSeenOperationDate":null}');
  });

  it("rejects a value it cannot parse", async () => {
    const storage = createMmkvStorage({ id: "corrupt" });
    const mmkv = jest.mocked(createMMKV).mock.results.at(-1)!.value;
    mmkv.set("history", "{not json");

    await expect(storage.get("history")).rejects.toThrow(SyntaxError);
  });
});
