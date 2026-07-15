import { generateMnemonic, accountFromMnemonic } from "iso-filecoin/wallet";
import { TEST_ADDRESSES } from "../../test/fixtures";
import { craftTransaction } from "./craftTransaction";

describe("craftTransaction (integration)", () => {
  it("crafts a native transaction with valid CBOR and message fields", async () => {
    // F1_ADDRESS is a valid on-chain address but RECIPIENT_F1 has an invalid checksum.
    // Generate a real valid recipient for the integ test.
    const mnemonic = generateMnemonic();
    const recipient = accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/0");

    const intent = {
      intentType: "transaction" as const,
      type: "send" as const,
      sender: TEST_ADDRESSES.F1_ADDRESS,
      recipient: recipient.address.toString(),
      amount: 1_000_000n,
      asset: { type: "native" as const },
      useAllAmount: false,
    };

    const customFees = {
      value: 150_000_000_000n,
      parameters: {
        gasFeeCap: "150000",
        gasLimit: "1000000",
        gasPremium: "125000",
      },
    };

    const crafted = await craftTransaction(intent, customFees);

    const parsed = JSON.parse(crafted.transaction);
    expect(typeof parsed.cbor).toBe("string");
    expect(parsed.cbor.length).toBeGreaterThan(0);
    expect(typeof parsed.message.to).toBe("string");
    expect(parsed.message.from).toContain("f1");
    expect(typeof parsed.message.nonce).toBe("number");
    expect(parsed.message.value).toBe("1000000");
    expect(typeof parsed.message.gasLimit).toBe("number");
    expect(parsed.message.gasLimit).toBeGreaterThan(0);
    expect(parsed.message.method).toBe(0);
  });

  it("crafts a send-max transaction with the full amount", async () => {
    const mnemonic = generateMnemonic();
    const recipient = accountFromMnemonic(mnemonic, "SECP256K1", "m/44'/461'/0'/0/0");

    const maxAmount = 10_000_000_000_000_000_000n; // 10 FIL
    const intent = {
      intentType: "transaction" as const,
      type: "send" as const,
      sender: TEST_ADDRESSES.F1_ADDRESS,
      recipient: recipient.address.toString(),
      amount: maxAmount,
      asset: { type: "native" as const },
      useAllAmount: true,
    };

    const customFees = {
      value: 150_000_000_000n,
      parameters: {
        gasFeeCap: "150000",
        gasLimit: "1000000",
        gasPremium: "125000",
      },
    };

    const crafted = await craftTransaction(intent, customFees);
    const parsed = JSON.parse(crafted.transaction);
    expect(parsed.message.value).toBe(maxAmount.toString());
    expect(parsed.message.method).toBe(0);
  });

  it("crafts an ERC-20 token transfer with InvokeEVM method and encoded params", async () => {
    // ERC-20 transfers require an ETH-format recipient and a contract address
    const ethRecipient = "0x1234567890123456789012345678901234567890";
    const erc20Contract = "0x2421db204968a367cc2c866cd057fa754cb84edf";

    const intent = {
      intentType: "transaction" as const,
      type: "send" as const,
      sender: TEST_ADDRESSES.F1_ADDRESS,
      recipient: ethRecipient,
      amount: 1_000_000n,
      asset: { type: "erc20" as const, assetReference: erc20Contract },
      useAllAmount: false,
    };

    const customFees = {
      value: 300_000_000_000n,
      parameters: {
        gasFeeCap: "300000",
        gasLimit: "10000000",
        gasPremium: "250000",
      },
    };

    const crafted = await craftTransaction(intent, customFees);

    const parsed = JSON.parse(crafted.transaction);
    expect(typeof parsed.cbor).toBe("string");
    expect(parsed.cbor.length).toBeGreaterThan(0);
    // Token transfers use InvokeEVM method (3844450837)
    expect(parsed.message.method).toBe(3844450837);
    // Token transfers send 0 FIL to the contract
    expect(parsed.message.value).toBe("0");
    // Params contain encoded ERC-20 transfer data
    expect(typeof parsed.message.params).toBe("string");
    expect(parsed.message.params.length).toBeGreaterThan(0);
  });
});
