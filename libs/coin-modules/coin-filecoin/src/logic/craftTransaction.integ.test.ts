import { generateMnemonic, accountFromMnemonic } from "iso-filecoin/wallet";
import { craftTransaction } from "./craftTransaction";

describe("craftTransaction (integration)", () => {
  it("crafts a native transaction with valid CBOR and message fields", async () => {
    const mnemonic = generateMnemonic();
    const sender = accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/0");
    const recipient = accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/1");

    const intent = {
      type: "send" as const,
      sender: sender.address.toString(),
      recipient: recipient.address.toString(),
      amount: 1_000_000n,
      asset: { type: "native" as const },
      useAllAmount: false,
    };

    // Use custom fees to exercise serialization with real addresses
    // without depending on the API returning valid fees for unfunded addresses.
    // The empty-fee-response bug (gas_fee_cap: "") is a separate implementation issue.
    const customFees = {
      value: 150_000_000_000n,
      parameters: {
        gasFeeCap: "150000",
        gasLimit: "1000000",
        gasPremium: "125000",
      },
    };

    const crafted = await craftTransaction(intent, customFees);

    expect(typeof crafted.transaction).toBe("string");

    const parsed = JSON.parse(crafted.transaction);
    // cbor must be a non-empty base64 string
    expect(typeof parsed.cbor).toBe("string");
    expect(parsed.cbor.length).toBeGreaterThan(0);

    // message must contain required Filecoin message fields
    expect(parsed.message).toBeDefined();
    expect(typeof parsed.message.to).toBe("string");
    expect(typeof parsed.message.from).toBe("string");
    expect(typeof parsed.message.nonce).toBe("number");
    expect(typeof parsed.message.value).toBe("string");
    expect(parsed.message.value).toBe("1000000");
    expect(typeof parsed.message.gasLimit).toBe("number");
    expect(parsed.message.gasLimit).toBeGreaterThan(0);
    expect(typeof parsed.message.gasFeeCap).toBe("string");
    expect(typeof parsed.message.gasPremium).toBe("string");
    expect(parsed.message.method).toBe(0); // native transfer
  });
});
