import { ClearSignContextType } from "@ledgerhq/context-module";
import { createMapEntryLoader, getConfidentialHandle } from "../src/confidential/mapEntryLoader";

// confidentialTransfer(to, encryptedAmount, inputProof) prepared on Sepolia for a cUSDCMock wrapper
const TRANSFER_DATA =
  "0x2fb74e62000000000000000000000000a92bd6359601d00ed49e34079ee91670c34acf80a4d54f839010f266716c6f090e24f922c8f3570822000000000000aa36a705000000000000000000000000000000000000000000000000000000000000000060";
const TRANSFER_HANDLE = "0xa4d54f839010f266716c6f090e24f922c8f3570822000000000000aa36a70500";
// unwrap(from, to, encryptedAmount, inputProof)
const UNWRAP_HANDLE = `0x${"ab".repeat(32)}`;
const UNWRAP_DATA = `0x5bf4ef06${"00".repeat(12)}${"11".repeat(20)}${"00".repeat(12)}${"22".repeat(20)}${UNWRAP_HANDLE.slice(2)}${"00".repeat(31)}80`;

const input = { chainId: 11155111, data: TRANSFER_DATA, deviceModelId: "flex" };
const entry = {
  payload: "0001010103aa36a7",
  certificate: { keyUsageNumber: 11, payload: "0102ff" },
};

function fetchReturning(ok: boolean, body: unknown) {
  return jest.fn(async (_url: string) => ({ ok, json: async () => body }));
}

describe("getConfidentialHandle", () => {
  it("reads the handle argument of confidentialTransfer and unwrap", () => {
    expect(getConfidentialHandle(TRANSFER_DATA)).toBe(TRANSFER_HANDLE);
    expect(getConfidentialHandle(UNWRAP_DATA)).toBe(UNWRAP_HANDLE);
  });

  it("ignores any other call", () => {
    expect(getConfidentialHandle(`0xa9059cbb${"00".repeat(64)}`)).toBeUndefined();
    expect(getConfidentialHandle("0x")).toBeUndefined();
  });
});

describe("createMapEntryLoader", () => {
  it("handles confidential wrapper calls only when map entries are expected", () => {
    const loader = createMapEntryLoader("http://localhost:8787", fetchReturning(true, entry));
    expect(loader.canHandle(input, [ClearSignContextType.ETHEREUM_MAP_ENTRY])).toBe(true);
    expect(loader.canHandle(input, [ClearSignContextType.ETHEREUM_TOKEN])).toBe(false);
    expect(
      loader.canHandle({ ...input, data: `0xa9059cbb${"00".repeat(64)}` }, [
        ClearSignContextType.ETHEREUM_MAP_ENTRY,
      ]),
    ).toBe(false);
  });

  it("fetches the entry of the calldata handle and returns it with its certificate", async () => {
    const fetchFn = fetchReturning(true, entry);
    const loader = createMapEntryLoader("http://localhost:8787/", fetchFn);

    const contexts = await loader.load(input);

    expect(fetchFn).toHaveBeenCalledWith(
      `http://localhost:8787/map-entry/${TRANSFER_HANDLE}?chainId=11155111&device=flex`,
    );
    expect(contexts).toEqual([
      {
        type: ClearSignContextType.ETHEREUM_MAP_ENTRY,
        payload: entry.payload,
        certificate: { keyUsageNumber: 11, payload: Uint8Array.from([0x01, 0x02, 0xff]) },
      },
    ]);
  });

  it("returns the entry without certificate when the service gives none", async () => {
    const loader = createMapEntryLoader(
      "http://localhost:8787",
      fetchReturning(true, { payload: entry.payload, certificate: null }),
    );
    expect(await loader.load(input)).toEqual([
      {
        type: ClearSignContextType.ETHEREUM_MAP_ENTRY,
        payload: entry.payload,
        certificate: undefined,
      },
    ]);
  });

  it.each([
    ["the service has no entry", fetchReturning(false, { error: { code: "ENTRY_NOT_FOUND" } })],
    ["the body is not an entry", fetchReturning(true, { unexpected: true })],
    [
      "the service is unreachable",
      jest.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    ],
  ])("returns no context when %s", async (_label, fetchFn) => {
    const loader = createMapEntryLoader("http://localhost:8787", fetchFn);
    expect(await loader.load(input)).toEqual([]);
  });
});
