import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { TransportStatusError } from "@ledgerhq/errors";
import { AccountAddress, TransactionType } from "@ledgerhq/concordium-core";
import type { Transaction, CredentialDeploymentTransaction } from "@ledgerhq/concordium-core";
import Concordium from "./Concordium";
import * as serialization from "./serialization";

// Wrap prepareTransferAPDU as jest.fn() so it can be mocked per-test
jest.mock("./serialization", () => {
  const actual = jest.requireActual<typeof import("./serialization")>("./serialization");
  return {
    ...actual,
    prepareTransferAPDU: jest.fn(actual.prepareTransferAPDU),
  };
});

const PATH = "44'/919'/0'/0/0";

function createMockTransport(responses: Buffer | Buffer[]) {
  const responseList = Array.isArray(responses) ? responses : [responses];
  let callIdx = 0;
  const send = jest.fn().mockImplementation(() => {
    const resp = responseList[Math.min(callIdx++, responseList.length - 1)];
    return Promise.resolve(resp);
  });
  return { send, decorateAppAPIMethods: jest.fn() };
}

describe("Concordium", () => {
  describe("decorateAppAPIMethods", () => {
    it("should properly decorate transport methods", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());

      // WHEN
      const concordium = new Concordium(transport);

      // THEN
      expect(concordium.transport).toBeDefined();
      expect(typeof concordium.getAddress).toBe("function");
      expect(typeof concordium.getPublicKey).toBe("function");
      expect(typeof concordium.verifyAddress).toBe("function");
      expect(typeof concordium.signTransaction).toBe("function");
      expect(typeof concordium.signCredentialDeployment).toBe("function");
    });
  });

  describe("getPublicKey", () => {
    it("should get public key without confirmation", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e001010015058000002c80000397800000000000000000000000
          <= 2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb79000
        `),
      );
      const concordium = new Concordium(transport);

      // WHEN
      const result = await concordium.getPublicKey(PATH, false);

      // THEN
      expect(result).toBe("2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7");
    });

    it("should get public key with confirmation", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e001000015058000002c80000397800000000000000000000000
          <= 2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb79000
        `),
      );
      const concordium = new Concordium(transport);

      // WHEN
      const result = await concordium.getPublicKey(PATH, true);

      // THEN
      expect(result).toBe("2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7");
    });

    it("should throw on invalid derivation path", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());
      const concordium = new Concordium(transport);

      // WHEN & THEN
      await expect(concordium.getPublicKey("invalid-path")).rejects.toThrow();
    });
  });

  describe("getAddress", () => {
    it("should get address without display", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e001010015058000002c80000397800000000000000000000000
          <= 2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb79000
        `),
      );
      const concordium = new Concordium(transport);

      // WHEN
      const result = await concordium.getAddress(PATH, false, 0, 0, 0);

      // THEN
      expect(result).toEqual({
        address: "2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7",
        publicKey: "2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7",
      });
    });

    it("should use display=false when display argument is omitted", async () => {
      // GIVEN - calling without display uses the default (false), skips VERIFY_ADDRESS
      const response = Buffer.concat([Buffer.alloc(32, 0x25), Buffer.from([0x90, 0x00])]);
      const mockTransport = createMockTransport(response);
      const concordium = new Concordium(mockTransport as any);

      // WHEN - omit display; TypeScript-typed callers always pass it, but JS callers may not
      const result = await (concordium as any).getAddress(PATH);

      // THEN - takes the GET_PUBLIC_KEY path (display !== true)
      expect(result.publicKey).toBeDefined();
      expect(mockTransport.send).toHaveBeenCalledWith(
        0xe0,
        0x01,
        expect.any(Number),
        expect.any(Number),
        expect.any(Buffer),
      );
    });

    it("should get address with display (verify on device)", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e00001000c000000000000000000000000
          <= 40323538306264383366386637373534356563316532363138646434623838653531303039346437376238356539663938323761653164376364653834666262379000
          => e001010015058000002c80000397800000000000000000000000
          <= 2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb79000
        `),
      );
      const concordium = new Concordium(transport);

      // WHEN
      const result = await concordium.getAddress(PATH, true, 0, 0, 0);

      // THEN
      expect(result.publicKey).toBe(
        "2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7",
      );
      expect(result.address).toBe(
        "2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7",
      );
    });

    it("should throw when id/cred/idp not provided with display=true", async () => {
      // GIVEN - JS callers may omit required params at runtime
      const mockTransport = createMockTransport(Buffer.from([0x90, 0x00]));
      const concordium = new Concordium(mockTransport as any);

      // WHEN/THEN - (concordium as any) bypasses TypeScript to simulate JS caller
      await expect((concordium as any).getAddress(PATH, true)).rejects.toThrow(
        "idp, id, and cred must be provided for new path",
      );
    });

    it("should throw on invalid derivation path", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());
      const concordium = new Concordium(transport);

      // WHEN & THEN
      await expect(concordium.getAddress("invalid-path", false, 0, 0, 0)).rejects.toThrow();
    });

    it("should handle user rejected address verification", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e00001000c000000000000000000000000
          <= 6985
        `),
      );
      const concordium = new Concordium(transport);

      // WHEN & THEN
      await expect(concordium.getAddress(PATH, true, 0, 0, 0)).rejects.toThrow(
        new TransportStatusError(0x6985),
      );
    });
  });

  describe("verifyAddress", () => {
    it("should verify address and return status without credentialId", async () => {
      // GIVEN
      const address = "2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7";
      const addressBytes = Buffer.from(address, "ascii");
      const response = Buffer.concat([
        Buffer.from([addressBytes.length]),
        addressBytes,
        Buffer.from([0x90, 0x00]),
      ]);
      const mockTransport = createMockTransport(response);
      const concordium = new Concordium(mockTransport as any);

      // WHEN
      const result = await concordium.verifyAddress(0, 0, 0);

      // THEN
      expect(result.status).toBe("9000");
      expect(result.address).toBe(address);
      expect(result.deviceCredId).toBeUndefined();
      expect(result.devicePrfKey).toBeUndefined();
    });

    it("should parse deviceCredId and devicePrfKey when credentialId provided", async () => {
      // GIVEN
      const address = "TestAddr";
      const addressBytes = Buffer.from(address, "ascii");
      const deviceCredIdBytes = Buffer.alloc(48, 0xbb);
      const devicePrfKeyBytes = Buffer.alloc(32, 0xcc);
      const response = Buffer.concat([
        Buffer.from([addressBytes.length]),
        addressBytes,
        deviceCredIdBytes,
        devicePrfKeyBytes,
        Buffer.from([0x90, 0x00]),
      ]);
      const mockTransport = createMockTransport(response);
      const concordium = new Concordium(mockTransport as any);

      // WHEN
      const result = await concordium.verifyAddress(0, 0, 0, "someCredId");

      // THEN
      expect(result.deviceCredId).toBe("bb".repeat(48));
      expect(result.devicePrfKey).toBe("cc".repeat(32));
    });

    it("should skip deviceCredId/devicePrfKey when response has no extra data", async () => {
      // GIVEN - response with address only, no extra bytes after it
      const address = "Short";
      const addressBytes = Buffer.from(address, "ascii");
      const response = Buffer.concat([
        Buffer.from([addressBytes.length]),
        addressBytes,
        Buffer.from([0x90, 0x00]),
      ]);
      const mockTransport = createMockTransport(response);
      const concordium = new Concordium(mockTransport as any);

      // WHEN - credentialId provided but response has no credId/prfKey data
      const result = await concordium.verifyAddress(0, 0, 0, "someCredId");

      // THEN
      expect(result.deviceCredId).toBeUndefined();
      expect(result.devicePrfKey).toBeUndefined();
    });

    it("should throw when id/cred/idp not provided", async () => {
      // GIVEN - JS callers may omit required params at runtime
      const mockTransport = createMockTransport(Buffer.from([0x90, 0x00]));
      const concordium = new Concordium(mockTransport as any);

      // WHEN/THEN
      await expect((concordium as any).verifyAddress()).rejects.toThrow(
        "idp, id, and cred must be provided for new path",
      );
    });
  });

  describe("signTransaction", () => {
    const sigBytes = Buffer.alloc(64, 0xaa);
    const sigResponse = Buffer.concat([sigBytes, Buffer.from([0x90, 0x00])]);
    const okResponse = Buffer.from([0x90, 0x00]);

    it("should sign a Transfer transaction and return signature", async () => {
      // GIVEN
      const mockTransport = createMockTransport(sigResponse);
      const concordium = new Concordium(mockTransport as any);
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
        },
      };

      // WHEN
      const result = await concordium.signTransaction(tx, PATH);

      // THEN
      expect(result.signature).toBe("aa".repeat(64));
      expect(result.serialized).toBeDefined();
      // SIGN_TRANSFER INS = 0x02
      expect(mockTransport.send).toHaveBeenCalledWith(
        0xe0,
        0x02,
        expect.any(Number),
        expect.any(Number),
        expect.any(Buffer),
      );
    });

    it("should send P2.MORE for first chunk and P2.LAST for final chunk", async () => {
      // GIVEN - mock prepareTransferAPDU to return 2 chunks, forcing P2.MORE path
      const mockTransport = createMockTransport([okResponse, sigResponse]);
      const concordium = new Concordium(mockTransport as any);
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.Transfer,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
        },
      };

      (serialization.prepareTransferAPDU as jest.Mock).mockReturnValueOnce([
        Buffer.alloc(255, 0x01), // chunk 1: P2.MORE
        Buffer.alloc(50, 0x02), // chunk 2: P2.LAST
      ]);

      // WHEN
      const result = await concordium.signTransaction(tx, PATH);

      // THEN - first chunk uses P2.MORE (0x80), second uses P2.LAST (0x00)
      const calls = mockTransport.send.mock.calls;
      expect(calls[0][3]).toBe(0x80); // P2.MORE for chunk 1
      expect(calls[1][3]).toBe(0x00); // P2.LAST for chunk 2
      expect(result.signature).toBe("aa".repeat(64));
    });

    it("should throw when transaction type is not Transfer or TransferWithMemo", async () => {
      // GIVEN - signTransaction routes unknown types to signTransfer, which rejects them
      const mockTransport = createMockTransport(Buffer.from([0x90, 0x00]));
      const concordium = new Concordium(mockTransport as any);
      const tx = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: 99 as TransactionType,
        payload: {} as any,
      };

      // WHEN/THEN
      await expect(concordium.signTransaction(tx, PATH)).rejects.toThrow(
        "Transaction type must be Transfer",
      );
    });

    it("should sign a TransferWithMemo transaction and return signature", async () => {
      // GIVEN - header + memo + amount APDUs; signature comes from the last send
      const mockTransport = createMockTransport([okResponse, okResponse, sigResponse]);
      const concordium = new Concordium(mockTransport as any);
      const tx: Transaction = {
        header: {
          sender: AccountAddress.fromBuffer(Buffer.alloc(32, 0x01)),
          nonce: 1n,
          expiry: 1000n,
          energyAmount: 500n,
        },
        type: TransactionType.TransferWithMemo,
        payload: {
          toAddress: AccountAddress.fromBuffer(Buffer.alloc(32, 0x02)),
          amount: 1000n,
          memo: Buffer.from("Hello"),
        },
      };

      // WHEN
      const result = await concordium.signTransaction(tx, PATH);

      // THEN
      expect(result.signature).toBe("aa".repeat(64));
      expect(result.serialized).toBeDefined();
      // SIGN_TRANSFER_WITH_MEMO INS = 0x32
      expect(mockTransport.send).toHaveBeenCalledWith(
        0xe0,
        0x32,
        expect.any(Number),
        expect.any(Number),
        expect.any(Buffer),
      );
    });
  });

  describe("signCredentialDeployment", () => {
    const credTx: CredentialDeploymentTransaction = {
      credentialPublicKeys: {
        keys: {
          "0": { schemeId: "Ed25519", verifyKey: "a".repeat(64) },
        },
        threshold: 1,
      },
      credId: "b".repeat(96),
      ipIdentity: 0,
      revocationThreshold: 2,
      arData: {
        "1": { encIdCredPubShare: "cc".repeat(96) },
      },
      policy: {
        validTo: "202612",
        createdAt: "202512",
        revealedAttributes: {},
      },
      proofs: {
        sig: "d".repeat(128),
        commitments: "e".repeat(96),
        challenge: "f".repeat(64),
        proofIdCredPub: {},
        proofIpSig: "11".repeat(64),
        proofRegId: "22".repeat(64),
        credCounterLessThanMaxAccounts: "33".repeat(64),
      },
      expiry: 1000000n,
    };

    it("should sign credential deployment and return signature hex", async () => {
      // GIVEN - mock returns signature on every call; only last response is used
      const sigBytes = Buffer.alloc(64, 0xdd);
      const response = Buffer.concat([sigBytes, Buffer.from([0x90, 0x00])]);
      const mockTransport = createMockTransport(response);
      const concordium = new Concordium(mockTransport as any);

      // WHEN
      const signature = await concordium.signCredentialDeployment(credTx, PATH);

      // THEN - signature is 64 bytes hex from last response (minus 2 status bytes)
      expect(signature).toBe("dd".repeat(64));
      // SIGN_CREDENTIAL_DEPLOYMENT INS = 0x04
      expect(mockTransport.send).toHaveBeenCalledWith(
        0xe0,
        0x04,
        expect.any(Number),
        expect.any(Number),
        expect.any(Buffer),
      );
    });

    it("should send more APDUs when credential has attributes", async () => {
      // GIVEN
      const txWithAttrs: CredentialDeploymentTransaction = {
        ...credTx,
        policy: {
          ...credTx.policy,
          revealedAttributes: { "0": "attr0", "1": "attr1" },
        },
      };
      const response = Buffer.concat([Buffer.alloc(64, 0xff), Buffer.from([0x90, 0x00])]);

      const mockNoAttrs = createMockTransport(response);
      const mockWithAttrs = createMockTransport(response);
      const concordiumNoAttrs = new Concordium(mockNoAttrs as any);
      const concordiumWithAttrs = new Concordium(mockWithAttrs as any);

      // WHEN
      await concordiumNoAttrs.signCredentialDeployment(credTx, PATH);
      await concordiumWithAttrs.signCredentialDeployment(txWithAttrs, PATH);

      // THEN - attributes add extra APDUs (tag + value per attribute)
      expect(mockWithAttrs.send.mock.calls.length).toBeGreaterThan(
        mockNoAttrs.send.mock.calls.length,
      );
    });
  });
});
