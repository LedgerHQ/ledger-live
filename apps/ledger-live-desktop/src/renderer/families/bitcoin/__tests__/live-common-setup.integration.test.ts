import {
  getSecp256k1Instance,
  setSecp256k1Instance,
} from "@ledgerhq/coin-bitcoin/wallet-btc/crypto/secp256k1";

jest.setTimeout(30000); // Web workers may take some time

// Get the original secp256k1 instance BEFORE any setup runs
const originalSecp256k1Instance = getSecp256k1Instance();

// Mock worker that uses the captured original secp256k1 instance
class MockPublicKeyTweakAddWorker {
  constructor(url: string) {
    this.url = url;
    this.onmessage = () => {};
  }

  postMessage(msg: { publicKey: string; tweak: string; id: number }) {
    // Simulate async behavior
    setTimeout(() => {
      this.processMessage(msg);
    }, 10); // Small delay to simulate async behavior
  }

  async processMessage(msg: { publicKey: string; tweak: string; id: number }) {
    try {
      // Convert hex strings back to Uint8Array
      const publicKeyArray = new Uint8Array(Buffer.from(msg.publicKey, "hex"));
      const tweakArray = new Uint8Array(Buffer.from(msg.tweak, "hex"));

      // Use the original secp256k1 instance captured before setup
      const result = await originalSecp256k1Instance.publicKeyTweakAdd(publicKeyArray, tweakArray);

      // Convert result back to hex
      const responseHex = Buffer.from(result).toString("hex");

      // Send response back
      this.onmessage({
        data: { response: responseHex, id: msg.id },
      });
    } catch (error) {
      console.error("Mock worker error:", error);
      // Simulate worker error by not sending any response
      // This will cause the promise to hang, which is what happens in real error cases
    }
  }

  terminate() {
    // Mock termination
  }

  url: string;
  onmessage: (event: { data: { response: string; id: number } }) => void;
}

describe("Bitcoin Live Common Setup - Web Worker Integration", () => {
  // Test data: real secp256k1 public key and tweak
  const testData = {
    // Example public key (33 bytes, compressed)
    publicKey: new Uint8Array([
      0x02, 0x79, 0xbe, 0x66, 0x7e, 0xf9, 0xdc, 0xbb, 0xac, 0x55, 0xa0, 0x62, 0x95, 0xce, 0x87,
      0x0b, 0x07, 0x02, 0x9b, 0xfc, 0xdb, 0x2d, 0xce, 0x28, 0xd9, 0x59, 0xf2, 0x81, 0x5b, 0x16,
      0xf8, 0x17, 0x98,
    ]),
    // Example tweak (32 bytes)
    tweak: new Uint8Array([
      0x3a, 0x26, 0x4e, 0x52, 0x4f, 0x6c, 0xbb, 0x04, 0x3d, 0x26, 0x75, 0xb5, 0x69, 0x87, 0x8c,
      0x3b, 0x6d, 0x43, 0xe5, 0x63, 0x8f, 0x3b, 0x0e, 0x0b, 0x1a, 0x6e, 0x5c, 0x30, 0x43, 0x7b,
      0x5d, 0x24,
    ]),
  };

  let originalDefaultInstance: ReturnType<typeof getSecp256k1Instance>;
  let webWorkerInstance: ReturnType<typeof getSecp256k1Instance>;
  let originalWorker: typeof global.Worker;

  beforeAll(() => {
    // IMPORTANT: Capture the original/default implementation BEFORE live-common-setup runs
    originalDefaultInstance = getSecp256k1Instance();

    // Save the original Worker mock
    originalWorker = global.Worker;

    // Replace with our functional mock for this test
    // @ts-expect-error: Mocking Worker for testing purposes
    global.Worker = MockPublicKeyTweakAddWorker;

    // Load the live-common-setup (this happens automatically in the real app at startup)
    require("../live-common-setup");
    
    // Capture the web worker instance AFTER live-common-setup runs
    webWorkerInstance = getSecp256k1Instance();
  });

  afterAll(() => {
    // Restore the original instance and Worker mock
    setSecp256k1Instance(originalDefaultInstance);
    global.Worker = originalWorker;
  });

  it("should have configured publicKeyTweakAdd to use web workers", async () => {
    // The setup should have replaced the default implementation
    expect(webWorkerInstance).not.toBe(originalDefaultInstance);
    expect(webWorkerInstance).toBeDefined();
    expect(typeof webWorkerInstance.publicKeyTweakAdd).toBe("function");
  });

  it("web worker implementation should produce same results as default implementation", async () => {
    // Get result from web worker implementation
    const webWorkerResult = await webWorkerInstance.publicKeyTweakAdd(
      testData.publicKey,
      testData.tweak,
    );

    // Get result from original/default implementation
    const defaultResult = await originalDefaultInstance.publicKeyTweakAdd(
      testData.publicKey,
      testData.tweak,
    );

    // They should be identical
    expect(webWorkerResult).toEqual(defaultResult);
  });
});
