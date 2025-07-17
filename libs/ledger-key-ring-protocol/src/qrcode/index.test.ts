import { createQRCodeHostInstance, createQRCodeCandidateInstance } from ".";
import WebSocket from "ws";
import { convertKeyPairToLiveCredentials } from "../sdk";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { ScannedInvalidQrCode, ScannedOldImportQrCode } from "../errors";

// Test data constants
const MOCK_TRUSTCHAIN = {
  rootId: "test-root-id",
  walletSyncEncryptionKey: "test-wallet-sync-encryption-key",
  applicationPath: "m/0'/16'/0'",
} as const;

const LEGACY_IMPORT_QR_CODE =
  "ZAADAAIAAAAEd2JXMpuoYdzvkNzFTlmQLPcGf2LSjDOgqaB3nQoZqlimcCX6HNkescWKyT1DCGuwO7IesD7oYg+fdZPkiIfFL3V9swfZRePkaNN09IjXsWLsim9hK/qi/RC1/ofX3hYNKUxUAgYVVG82WKXIk47siWfUlRZsCYSAARQ6ASpUgidPjMHaOMK6w53wTZplwo7Zjv1HrIyKwr3Ci8OmrFye5g==";

const CRYPTO_ADDRESSES = {
  ethereum: "0x6fC39c0C6D379d8D168e9EFD90C4B55Fc1Bb1fF2",
  solana: "5eMHnPQa4vHP6oFbydZx6RjzGvZR2qZtCQ7E8yrFw93n",
  ripple: "rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1",
  cardano:
    "addr1q9dduxx8zhp4vq4rkfsl8gk0wnwhkyd4shzdc3u9jxuw8c3af2cqpjnhx8yqz3sjdf8ttf5htp2v07ah3ts2mtfzw46qqj7kzw",
  bitcoin: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  cosmos: "cosmos1h9w6z0sgp2k4z6qzwk0jhp5a5rz87vt4l25fsl",
} as const;

describe("Trustchain QR Code", () => {
  let server: WebSocket.Server;
  let wsA: WebSocket | null = null;
  let wsB: WebSocket | null = null;

  beforeAll(() => {
    server = new WebSocket.Server({ port: 1234 });
    server.on("connection", ws => {
      if (!wsA) {
        wsA = ws;
      } else if (!wsB) {
        wsB = ws;
      }
      ws.on("message", message => {
        if (ws === wsA && wsB) {
          wsB.send(message);
        } else if (ws === wsB && wsA) {
          wsA.send(message);
        }
      });
    });
  });

  afterAll(async () => {
    if (wsA) {
      wsA.terminate();
      wsA = null;
    }
    if (wsB) {
      wsB.terminate();
      wsB = null;
    }
    if (server) {
      await new Promise<void>(resolve => {
        server.close(() => resolve());
      });
    }
  });

  /**
   * Helper function to create common test setup
   */
  const createTestSetup = async () => {
    const memberCredentials = convertKeyPairToLiveCredentials(await crypto.randomKeypair());
    const addMember = jest.fn(() => Promise.resolve(MOCK_TRUSTCHAIN));
    const onRequestQRCodeInput = jest.fn();
    return {
      memberCredentials,
      addMember,
      onRequestQRCodeInput,
      memberName: "foo",
    };
  };

  test("digits matching scenario", async () => {
    const { memberCredentials, addMember, memberName } = await createTestSetup();
    const onDisplayDigits = jest.fn();

    let scannedUrlResolve: (url: string) => void;
    const scannedUrlPromise = new Promise<string>(resolve => {
      scannedUrlResolve = resolve;
    });

    const onDisplayQRCode = (url: string) => {
      scannedUrlResolve(url);
    };

    const onRequestQRCodeInput = jest.fn((config, callback) =>
      callback(onDisplayDigits.mock.calls[0][0]),
    );

    const hostP = createQRCodeHostInstance({
      trustchainApiBaseUrl: "ws://localhost:1234",
      onDisplayQRCode,
      onDisplayDigits,
      addMember,
      memberCredentials,
      memberName,
      initialTrustchainId: MOCK_TRUSTCHAIN.rootId,
    });

    const scannedUrl = await scannedUrlPromise;

    const candidateP = createQRCodeCandidateInstance({
      memberCredentials,
      memberName,
      initialTrustchainId: undefined,
      addMember,
      scannedUrl,
      onRequestQRCodeInput,
    });

    const [_, res] = await Promise.all([hostP, candidateP]);

    expect(onDisplayDigits).toHaveBeenCalledWith(expect.any(String));
    expect(addMember).toHaveBeenCalled();
    expect(onRequestQRCodeInput).toHaveBeenCalledWith(
      { digits: 3, connected: false },
      expect.any(Function),
    );
    expect(res).toEqual(MOCK_TRUSTCHAIN);
  });

  test("invalid qr code scanned", async () => {
    const { memberCredentials, addMember, onRequestQRCodeInput, memberName } =
      await createTestSetup();
    const scannedUrl = "https://example.com";

    const candidateP = createQRCodeCandidateInstance({
      memberCredentials,
      memberName,
      initialTrustchainId: undefined,
      addMember,
      scannedUrl,
      onRequestQRCodeInput,
    });

    await expect(candidateP).rejects.toThrow(new ScannedInvalidQrCode());
  });

  test("old accounts export qr code scanned", async () => {
    const { memberCredentials, addMember, onRequestQRCodeInput, memberName } =
      await createTestSetup();

    const candidateP = createQRCodeCandidateInstance({
      memberCredentials,
      memberName,
      initialTrustchainId: undefined,
      addMember,
      scannedUrl: LEGACY_IMPORT_QR_CODE,
      onRequestQRCodeInput,
    });

    await expect(candidateP).rejects.toThrow(new ScannedOldImportQrCode());
  });

  it.each(Object.entries(CRYPTO_ADDRESSES))(
    "should reject cryptocurrency address (%s) as invalid QR code",
    async (_, address) => {
      const { memberCredentials, addMember, onRequestQRCodeInput, memberName } =
        await createTestSetup();

      const candidateP = createQRCodeCandidateInstance({
        memberCredentials,
        memberName,
        initialTrustchainId: undefined,
        addMember,
        scannedUrl: address,
        onRequestQRCodeInput,
      });

      await expect(candidateP).rejects.toThrow(new ScannedInvalidQrCode());
    },
  );
});
