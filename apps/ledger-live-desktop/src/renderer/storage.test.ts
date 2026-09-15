import { ipcRenderer } from "electron";
import { getKey } from "./storage";

jest.mock("electron", () => ({
  ipcRenderer: {
    invoke: jest.fn(),
  },
}));

const mockInvoke = jest.mocked(ipcRenderer.invoke);

describe("getKey", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it.each(["accounts", "trustchain", "wallet"] as const)(
    "should identify encrypted %s data",
    async keyPath => {
      mockInvoke.mockResolvedValue("encrypted-value");

      await expect(getKey("app", keyPath)).resolves.toEqual({ status: "encrypted" });
    },
  );

  it("should represent missing protected data as available null", async () => {
    mockInvoke.mockResolvedValue(undefined);

    await expect(getKey("app", "trustchain")).resolves.toEqual({
      status: "available",
      data: null,
    });
  });

  it("should represent explicit protected null as available null", async () => {
    mockInvoke.mockResolvedValue(null);

    await expect(getKey("app", "wallet")).resolves.toEqual({
      status: "available",
      data: null,
    });
  });

  it("should apply protected defaults after reading storage", async () => {
    mockInvoke.mockResolvedValue(undefined);

    await expect(getKey("app", "accounts", [])).resolves.toEqual({
      status: "available",
      data: [],
    });
    expect(mockInvoke).toHaveBeenCalledWith("getKey", {
      ns: "app",
      keyPath: "accounts",
      defaultValue: undefined,
    });
  });
});
