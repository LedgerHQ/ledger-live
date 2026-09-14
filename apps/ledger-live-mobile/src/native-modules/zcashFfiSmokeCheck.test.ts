// The factories create their own mocks rather than closing over module-scope
// consts: `jest.mock` is hoisted above those declarations, so referencing them
// here would read them inside their temporal dead zone.
jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

jest.mock("./ZcashFfiModule", () => ({
  isZcashFfiAvailable: jest.fn(),
  deriveOrchardAddress: jest.fn(),
  runThreadProbe: jest.fn(),
  ZcashFfiError: class ZcashFfiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

import { log } from "@ledgerhq/logs";
import {
  deriveOrchardAddress,
  isZcashFfiAvailable,
  runThreadProbe,
  ZcashFfiError,
} from "./ZcashFfiModule";
import { logZcashFfiSmokeCheck, ZCASH_FFI_LOG_TYPE } from "./zcashFfiSmokeCheck";

const mockLog = jest.mocked(log);
const mockIsAvailable = jest.mocked(isZcashFfiAvailable);
const mockDerive = jest.mocked(deriveOrchardAddress);
const mockProbe = jest.mocked(runThreadProbe);

const PROBE_RESULT = {
  threads: 8,
  iterations: 200,
  serial_ms: 100,
  parallel_ms: 20,
  speedup: 5,
};

const EXPECTED_ADDRESS =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";

const loggedMessage = () => mockLog.mock.calls[0][1];

beforeEach(() => {
  jest.clearAllMocks();
  mockIsAvailable.mockReturnValue(true);
  mockProbe.mockResolvedValue(PROBE_RESULT);
});

it("reports the engine as OK when the derived address matches the device vector", async () => {
  mockDerive.mockResolvedValue(EXPECTED_ADDRESS);

  await logZcashFfiSmokeCheck();

  expect(mockLog.mock.calls[0][0]).toBe(ZCASH_FFI_LOG_TYPE);
  expect(loggedMessage()).toContain("engine OK");
});

it("reports the threading probe after the derivation verdict", async () => {
  mockDerive.mockResolvedValue(EXPECTED_ADDRESS);

  await logZcashFfiSmokeCheck();

  expect(mockLog.mock.calls[1][1]).toContain("threads: 8");
  expect(mockLog.mock.calls[1][1]).toContain("speedup 5x");
});

it("keeps a failed probe from masking a good derivation verdict", async () => {
  mockDerive.mockResolvedValue(EXPECTED_ADDRESS);
  mockProbe.mockRejectedValue(new Error("no threads here"));

  await logZcashFfiSmokeCheck();

  expect(loggedMessage()).toContain("engine OK");
  expect(mockLog.mock.calls[1][1]).toContain("thread probe failed");
});

it("skips the probe when the derivation itself failed", async () => {
  // A probe result is meaningless if the engine could not even derive.
  mockDerive.mockRejectedValue(new ZcashFfiError("ZCASH_FFI_CRYPTO", "invalid UFVK"));

  await logZcashFfiSmokeCheck();

  expect(mockProbe).not.toHaveBeenCalled();
});

it("derives from the vector the Rust crate and the device agree on", async () => {
  mockDerive.mockResolvedValue(EXPECTED_ADDRESS);

  await logZcashFfiSmokeCheck();

  // A truncated or re-typed UFVK would still "work" while proving nothing, so
  // pin the input length and its encoding prefix.
  const [ufvk] = mockDerive.mock.calls[0];
  expect(ufvk).toHaveLength(302);
  expect(ufvk.startsWith("uview1")).toBe(true);
});

it("reports a mismatch rather than silence when the engine disagrees", async () => {
  mockDerive.mockResolvedValue("u1somethingelse");

  await logZcashFfiSmokeCheck();

  expect(loggedMessage()).toContain("MISMATCH");
});

it("reports the build carrying no engine", async () => {
  mockIsAvailable.mockReturnValue(false);

  await logZcashFfiSmokeCheck();

  expect(loggedMessage()).toContain("not linked");
  expect(mockDerive).not.toHaveBeenCalled();
});

it("logs the status code when the native call fails", async () => {
  mockDerive.mockRejectedValue(new ZcashFfiError("ZCASH_FFI_CRYPTO", "invalid UFVK"));

  await logZcashFfiSmokeCheck();

  expect(loggedMessage()).toContain("failed");
  expect(mockLog.mock.calls[0][2]).toMatchObject({ code: "ZCASH_FFI_CRYPTO" });
});

it("never rejects, so a broken engine cannot break app startup", async () => {
  mockDerive.mockRejectedValue("not even an error");

  await expect(logZcashFfiSmokeCheck()).resolves.toBeUndefined();
});
