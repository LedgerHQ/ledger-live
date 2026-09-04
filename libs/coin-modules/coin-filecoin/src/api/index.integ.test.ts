import { generateMnemonic, accountFromMnemonic } from "iso-filecoin/wallet";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/index";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import { createApi } from ".";
import type { FilecoinCoinConfig } from "../config";
import { TEST_ADDRESSES } from "../test/fixtures";
import { createMockFilecoinContext } from "../test/context";

describe("createApi (integration)", () => {
  let api: CoinModuleApi<FilecoinCoinConfig>;
  const context = createMockFilecoinContext();

  beforeAll(() => {
    // Through withDefaults, as the consumer resolver does: the module omits the capabilities the
    // chain has none of, and the wrapper is what turns them into the "not supported" answer below.
    api = withDefaults(createApi());
  });

  it("omits the capabilities the chain has none of", () => {
    const impl = createApi();
    for (const method of [
      "call",
      "register",
      "craftRawTransaction",
      "getBlock",
      "getBlockInfo",
      "getStakes",
      "getRewards",
      "getValidators",
    ] as const) {
      expect(impl).not.toHaveProperty(method);
    }
  });

  describe("unsupported methods", () => {
    it("getStakes throws not supported", () => {
      expect(() => api.getStakes(context, TEST_ADDRESSES.F1_ADDRESS)).toThrow(/not supported/);
    });

    it("getRewards throws not supported", () => {
      expect(() => api.getRewards(context, TEST_ADDRESSES.F1_ADDRESS)).toThrow(/not supported/);
    });

    it("getValidators throws not supported", () => {
      expect(() => api.getValidators(context)).toThrow(/not supported/);
    });

    it("getBlock throws not supported", () => {
      expect(() => api.getBlock(context, 1000)).toThrow(/not supported/);
    });

    it("getBlockInfo throws not supported", () => {
      expect(() => api.getBlockInfo(context, 1000)).toThrow(/not supported/);
    });

    it("craftRawTransaction throws not supported", () => {
      expect(() => api.craftRawTransaction(context, "tx", "sender", "pubkey", 0n)).toThrow(
        /not supported/,
      );
    });
  });

  describe("craft → combine flow", () => {
    it("craftTransaction output is consumable by combine", async () => {
      const mnemonic = generateMnemonic();
      const sender = accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/0");
      const recipient = accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/1");

      const crafted = await api.craftTransaction(
        context,
        {
          intentType: "transaction",
          type: "send",
          sender: sender.address.toString(),
          recipient: recipient.address.toString(),
          amount: 500_000_000_000_000_000n,
          asset: { type: "native" },
          useAllAmount: false,
        },
        {
          customFees: {
            value: 150_000_000_000n,
            parameters: {
              gasFeeCap: "150000",
              gasLimit: "1000000",
              gasPremium: "125000",
            },
          },
        },
      );

      // Combine with a mock signature (base64-encoded)
      const mockSignature = Buffer.from("a]fake-signature-bytes-for-testing").toString("base64");
      const signed = await api.combine(context, crafted.transaction, [mockSignature]);

      const parsed = JSON.parse(signed);
      expect(parsed.message.from).toBe(sender.address.toString());
      expect(parsed.message.to).toBe(recipient.address.toString());
      expect(parsed.message.value).toBe("500000000000000000");
      expect(parsed.message.method).toBe(0);
      expect(typeof parsed.message.nonce).toBe("number");
      expect(typeof parsed.message.gaslimit).toBe("number");
      expect(typeof parsed.message.gasfeecap).toBe("string");
      expect(typeof parsed.message.gaspremium).toBe("string");
      expect(parsed.signature.type).toBe(1);
      expect(parsed.signature.data).toBe(mockSignature);
    });
  });
});
