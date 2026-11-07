import { lastValueFrom, toArray } from "rxjs";
import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { ReceiveVerificationSchema } from "@domain/entity-account-receive";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { buildReceiveVerificationInput } from "./buildReceiveVerificationInput";

jest.mock("@ledgerhq/live-common/hw/getAddress/index", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const PATH = "m/44h/60h/0h/0/0";

const connection = { dmk: {}, sessionId: "session" } as unknown as DeviceConnectionResult;

const run = (input: ReturnType<typeof buildReceiveVerificationInput>) =>
  lastValueFrom(input.startAddressVerification(connection).observable.pipe(toArray()));

describe("buildReceiveVerificationInput", () => {
  beforeEach(() => {
    jest.mocked(getAddress).mockResolvedValue({ address: ADDRESS, publicKey: "04ab", path: PATH });
  });

  it("should show the address at the verification path with the legacy derivation mode", async () => {
    const entry = mockAccountEntry();
    const input = buildReceiveVerificationInput(
      entry,
      ReceiveVerificationSchema.parse({ type: "address", path: PATH, address: ADDRESS }),
    );

    expect(input.expectedAddress).toBe(ADDRESS);
    expect(await run(input)).toEqual([
      { type: "awaiting-confirmation" },
      { type: "confirmed", address: ADDRESS },
    ]);
    expect(getAddress).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ path: PATH, derivationMode: "", verify: true }),
    );
  });

  it("should compare the public key the device shows", async () => {
    const input = buildReceiveVerificationInput(
      mockAccountEntry(),
      ReceiveVerificationSchema.parse({ type: "publicKey", path: PATH, publicKey: "04ab" }),
    );

    expect(input.expectedAddress).toBe("04ab");
    expect((await run(input)).at(-1)).toEqual({ type: "confirmed", address: "04ab" });
  });

  it("should report an address confirmation as unsupported", async () => {
    const input = buildReceiveVerificationInput(
      mockAccountEntry(),
      ReceiveVerificationSchema.parse({
        type: "addressConfirmation",
        path: PATH,
        address: ADDRESS,
      }),
    );

    expect((await run(input)).map(state => state.type)).toEqual(["unsupported"]);
    expect(getAddress).not.toHaveBeenCalled();
  });
});
