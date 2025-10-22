import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { TransportStatusError } from "@ledgerhq/errors";
import Canton from "./Canton";

const PATH = "44'/6767'/0'/0'/0'";

describe("Canton", () => {
  describe("decorateAppAPIMethods", () => {
    it("should properly decorate transport methods", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());

      // WHEN
      const canton = new Canton(transport);

      // THEN
      expect(canton.transport).toBeDefined();
      expect(typeof canton.getAddress).toBe("function");
      expect(typeof canton.signTransaction).toBe("function");
      expect(typeof canton.getAppConfiguration).toBe("function");
    });
  });

  describe("getAddress", () => {
    it("should get address without display", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e005000015058000002c80001a6f800000008000000080000000
          <= 20c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c5109720c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c510979000
        `),
      );
      const canton = new Canton(transport);

      // WHEN
      const result = await canton.getAddress(PATH);

      // THEN
      expect(result).toEqual({
        address: "canton_402f2e68",
        path: PATH,
        publicKey: "c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c51097",
      });
    });

    it("should get address with display", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e005010015058000002c80001a6f800000008000000080000000
          <= 20c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c5109720c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c510979000
        `),
      );
      const canton = new Canton(transport);

      // WHEN
      const result = await canton.getAddress(PATH, true);

      // THEN
      expect(result).toEqual({
        address: "canton_402f2e68",
        path: PATH,
        publicKey: "c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c51097",
      });
    });

    it("should throw on invalid derivation path", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());
      const canton = new Canton(transport);

      // WHEN & THEN
      await expect(canton.getAddress("invalid-path")).rejects.toThrow();
    });

    it("should handle user refused address", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e005010015058000002c80001a6f800000008000000080000000
          <= 6985
        `),
      );
      const canton = new Canton(transport);

      // WHEN & THEN
      await expect(canton.getAddress(PATH, true)).rejects.toThrow(new TransportStatusError(0x6985));
    });
  });

  describe("signTransaction", () => {
    it("should sign untyped versioned message without challenge", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e006010315058000002c80001a6f800000008000000080000000
            <= 9000
            => e006010420d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd
            <= 40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00009000
          `),
      );
      const canton = new Canton(transport);
      const data = {
        transactions: ["d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd"],
      };

      // WHEN
      const result = await canton.signTransaction(PATH, data);

      // THEN
      expect(result).toEqual({
        signature:
          "a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
      });
    });

    it("should sign untyped versioned message with challenge", async () => {
      // GIVEN
      const challenge = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e006010335058000002c80001a6f800000008000000080000000${challenge}
            <= 9000
            => e006010420d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd
            <= 40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a000040b65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a009000
          `),
      );
      const canton = new Canton(transport);
      const data = {
        transactions: ["d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd"],
        challenge,
      };

      // WHEN
      const result = await canton.signTransaction(PATH, data);

      // THEN
      expect(result).toEqual({
        signature:
          "a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
        applicationSignature:
          "b65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
      });
    });

    it("should handle challenge with large transaction chunking", async () => {
      // GIVEN
      const challenge = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const largeTransaction =
        "d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd".repeat(10);
      const firstChunk = largeTransaction.substring(0, 510);
      const secondChunk = largeTransaction.substring(510, 640);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e006010335058000002c80001a6f800000008000000080000000${challenge}
            <= 9000
            => e0060102ff${firstChunk}
            <= 9000
            => e006010441${secondChunk}
            <= 40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a000040b65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a009000
          `),
      );
      const canton = new Canton(transport);
      const data = {
        transactions: [largeTransaction],
        challenge,
      };

      // WHEN
      const result = await canton.signTransaction(PATH, data);

      // THEN
      expect(result).toEqual({
        signature:
          "a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
        applicationSignature:
          "b65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
      });
    });

    it("should sign large untyped versioned message with chunking", async () => {
      // GIVEN
      const largeTransaction =
        "d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd".repeat(10);

      const firstChunk = largeTransaction.substring(0, 510);
      const secondChunk = largeTransaction.substring(510, 640);

      const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e006010315058000002c80001a6f800000008000000080000000
            <= 9000
            => e0060102ff${firstChunk}
            <= 9000
            => e006010441${secondChunk}
            <= 40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00009000
          `),
      );
      const canton = new Canton(transport);
      const data = {
        transactions: [largeTransaction],
      };

      // WHEN
      const result = await canton.signTransaction(PATH, data);

      // THEN
      expect(result).toEqual({
        signature:
          "a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
      });
    });

    it("should sign prepared transaction", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e006020315058000002c80001a6f800000008000000080000000
          <= 9000
          => e0060202ff${"1234567890abcdef".repeat(31)}1234567890abcd
          <= 9000
          => e006020608ef1234567890abcd
          <= 9000
          => e0060202ff${"1234567890abcdef".repeat(31)}1234567890abcd
          <= 9000
          => e006020608ef1234567890abcd
          <= 9000
          => e0060202ff${"1234567890abcdef".repeat(31)}1234567890abcd
          <= 9000
          => e006020608ef1234567890abcd
          <= 9000
          => e0060202ff${"1234567890abcdef".repeat(31)}1234567890abcd
          <= 9000
          => e006020408ef1234567890abcd
          <= 40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a009000
        `),
      );
      const canton = new Canton(transport);

      const testData = "1234567890abcdef".repeat(31) + "1234567890abcdef1234567890abcd";
      const components = {
        damlTransaction: Buffer.from(testData, "hex"),
        nodes: [Buffer.from(testData, "hex")],
        metadata: Buffer.from(testData, "hex"),
        inputContracts: [Buffer.from(testData, "hex")],
      };

      // WHEN
      const result = await canton.signTransaction(PATH, components);

      // THEN
      expect(result).toEqual({
        signature:
          "40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
      });
    });

    it("should handle user refused transaction", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e006010315058000002c80001a6f800000008000000080000000
            <= 6985
          `),
      );
      const canton = new Canton(transport);
      const data = {
        transactions: ["test"],
      };

      // WHEN & THEN
      await expect(canton.signTransaction(PATH, data)).rejects.toThrow(
        new TransportStatusError(0x6985),
      );
    });

    it("should handle invalid transaction data", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());
      const canton = new Canton(transport);

      // WHEN & THEN
      await expect(canton.signTransaction(PATH, null as any)).rejects.toThrow();
    });
  });

  describe("getAppConfiguration", () => {
    it("should get app configuration", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e003000000
          <= 0101009000
        `),
      );
      const canton = new Canton(transport);

      // WHEN
      const result = await canton.getAppConfiguration();

      // THEN
      expect(result).toEqual({
        version: "1.1.0",
      });
    });
  });

  describe("parseSignatureResponse", () => {
    it("should parse TLV format signature without challenge", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e006010315058000002c80001a6f800000008000000080000000
            <= 9000
            => e006010420d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd
            <= 40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a000040b65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a009000
          `),
      );
      const canton = new Canton(transport);
      const data = {
        transactions: ["d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd"],
      };

      // WHEN
      const result = await canton.signTransaction(PATH, data);

      // THEN
      // The response is a TLV format but without challenge, so it should return a CantonMultiSignature
      expect(result).toEqual({
        signature:
          "a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
        applicationSignature: undefined,
      });
    });

    it("should parse TLV format signature with challenge", async () => {
      // GIVEN
      const challenge = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e006010335058000002c80001a6f800000008000000080000000${challenge}
            <= 9000
            => e006010420d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd
            <= 40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a000040b65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a009000
          `),
      );
      const canton = new Canton(transport);
      const data = {
        transactions: ["d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd"],
        challenge,
      };

      // WHEN
      const result = await canton.signTransaction(PATH, data);

      // THEN
      expect(result).toEqual({
        signature:
          "a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
        applicationSignature:
          "b65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
      });
    });

    it("should parse single Ed25519 signature", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e006010315058000002c80001a6f800000008000000080000000
            <= 9000
            => e006010420d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd
            <= a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a009000
          `),
      );
      const canton = new Canton(transport);
      const data = {
        transactions: ["d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd"],
      };

      // WHEN
      const result = await canton.signTransaction(PATH, data);

      // THEN
      expect(result).toEqual({
        signature:
          "a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
      });
    });

    it("should parse Canton-framed signature", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
            => e006010315058000002c80001a6f800000008000000080000000
            <= 9000
            => e006010420d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd
            <= 40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00009000
          `),
      );
      const canton = new Canton(transport);
      const data = {
        transactions: ["d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd"],
      };

      // WHEN
      const result = await canton.signTransaction(PATH, data);

      // THEN
      expect(result).toEqual({
        signature:
          "a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
      });
    });
  });
});
