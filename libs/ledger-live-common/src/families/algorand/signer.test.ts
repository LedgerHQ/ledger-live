import { combine } from "@ledgerhq/coin-algorand/logic/combine";
import resolver from "@ledgerhq/coin-algorand/hw-getAddress";
import type Transport from "@ledgerhq/hw-transport";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { createSigner } from "./signer";

const CLA = 0x80;
const INS_GET_PUBLIC_KEY = 0x03;
const PATH = "44'/283'/0'/0'/0'";
// Unsigned payment from AEAQ…MI to itself, msgpack-encoded with algosdk.
const UNSIGNED_TX =
  "89a3616d7401a3666565cd03e8a2667601a367656eac6d61696e6e65742d76312e30a26768c4200202020202020202020202020202020202020202020202020202020202020202a26c7602a3726376c4200101010101010101010101010101010101010101010101010101010101010101a3736e64c4200101010101010101010101010101010101010101010101010101010101010101a474797065a3706179";

function mockTransport(response: Buffer) {
  const send = jest.fn().mockResolvedValue(response);
  const transport = { decorateAppAPIMethods: jest.fn(), send } as unknown as Transport;
  return { transport, send };
}

const publicKeyResponse = Buffer.concat([Buffer.alloc(32, 1), Buffer.from("9000", "hex")]);

describe("algorand signer", () => {
  it("does not ask for address approval when the framework fetches the key to sign", async () => {
    const { transport, send } = mockTransport(publicKeyResponse);

    await createSigner(transport).getAddress(PATH, { derivationMode: "" });

    expect(send).toHaveBeenCalledWith(
      CLA,
      INS_GET_PUBLIC_KEY,
      0x00,
      0,
      expect.any(Buffer),
      [0x9000],
    );
  });

  it("asks for address approval on receive with verify", async () => {
    const { transport, send } = mockTransport(publicKeyResponse);
    const getAddress = resolver(async (_deviceId, fn) => fn(createSigner(transport)));

    await getAddress("deviceId", {
      path: PATH,
      verify: true,
      derivationMode: "",
      currency: {} as never,
    });

    expect(send).toHaveBeenCalledWith(
      CLA,
      INS_GET_PUBLIC_KEY,
      0x80,
      0,
      expect.any(Buffer),
      [0x9000],
    );
  });

  it("rejects with UserRefusedOnDevice when the device answers SW_CANCEL", async () => {
    const { transport } = mockTransport(Buffer.from("6986", "hex"));

    await expect(createSigner(transport).signTransaction(PATH, UNSIGNED_TX)).rejects.toBeInstanceOf(
      UserRefusedOnDevice,
    );
  });

  it("returns a hex signature the coin module can combine", async () => {
    const signature = Buffer.concat([Buffer.alloc(64, 7), Buffer.from("9000", "hex")]);
    const { transport } = mockTransport(signature);

    const result = await createSigner(transport).signTransaction(PATH, UNSIGNED_TX);

    expect(result).toBe(signature.toString("hex"));
    expect(combine(UNSIGNED_TX, [result])).toMatch(/^[0-9a-f]+$/);
  });
});
