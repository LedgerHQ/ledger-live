import { LkrpQrNotImplementedError } from "./errors";
import {
  createQRCodeCandidateInstance,
  createQRCodeHostInstance,
  type LkrpQrTransport,
} from "./pairing";

const memberCredentials = {
  key: {
    id: "member-key",
    publicKey: Uint8Array.from([1]),
  },
};
const addMember = () =>
  Promise.resolve({
    rootId: "root",
    applicationPath: "m/0'",
  });
const channel = {
  send: () => Promise.resolve(),
  receive: async function* () {
    yield {};
  },
  close: () => Promise.resolve(),
};
const transport: LkrpQrTransport = {
  createHost: () => Promise.resolve({ url: "lkrp://pair", channel }),
  connect: () => Promise.resolve(channel),
};

describe("LKRP QR pairing shell", () => {
  it("exposes the host contract", async () => {
    await expect(
      createQRCodeHostInstance({
        transport,
        onDisplayQRCode: jest.fn(),
        onDisplayDigits: jest.fn(),
        addMember,
        memberCredentials,
        memberName: "Ledger Wallet",
      }),
    ).rejects.toEqual(expect.objectContaining({ name: LkrpQrNotImplementedError.name }));
  });

  it("exposes the candidate contract", async () => {
    await expect(
      createQRCodeCandidateInstance({
        transport,
        memberCredentials,
        memberName: "Ledger Wallet",
        addMember,
        scannedUrl: "wss://trustchain.example/v1/qr?host=00",
        onRequestQRCodeInput: jest.fn(),
      }),
    ).rejects.toEqual(expect.objectContaining({ name: LkrpQrNotImplementedError.name }));
  });
});
