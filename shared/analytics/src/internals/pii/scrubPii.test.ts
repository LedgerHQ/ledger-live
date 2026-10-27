import { scrubPii, scrubPiiString } from "./scrubPii";

const EVM_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const EVM_HASH = "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060";
const XPUB =
  "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8";
const BTC_BECH32 = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
const COSMOS_ADDRESS = "cosmos1hsk6jryyqjfhp5dhc55tc9jtckygx0eph6dd02";
const CARDANO_ADDRESS =
  "addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgse35a3x";
const LEDGER_ACCOUNT_ID = `js:2:ethereum:${EVM_ADDRESS}:`;

describe("scrubPiiString", () => {
  it.each([
    ["an EVM address", `sent to ${EVM_ADDRESS}`, "evm_address"],
    ["an EVM transaction hash", EVM_HASH, "evm_hash"],
    ["an extended public key", XPUB, "extended_public_key"],
    ["a Bitcoin bech32 address", BTC_BECH32, "bech32_address"],
    ["an upper-case Bitcoin bech32 address", BTC_BECH32.toUpperCase(), "bech32_address"],
    ["a Cosmos address", COSMOS_ADDRESS, "bech32_address"],
    ["a Cardano address", CARDANO_ADDRESS, "bech32_address"],
    ["an email address", "contact me at satoshi@example.com", "email"],
    [
      "an address in a path that looks like a token id",
      `account/address/${EVM_ADDRESS}`,
      "evm_address",
    ],
    ["an email in a path that looks like a token id", "contact/email/satoshi@example.com", "email"],
    ["a Ledger account id", `/account/${LEDGER_ACCOUNT_ID}`, "ledger_account_id"],
    [
      "an explorer link to a Bitcoin transaction",
      "https://mempool.space/tx/4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
      "explorer_url",
    ],
    [
      "an explorer link to a Solana account",
      "https://solscan.io/account/9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      "explorer_url",
    ],
  ])("redacts %s", (_label, input, kind) => {
    const { value, kinds } = scrubPiiString(input);

    expect(kinds).toContain(kind);
    expect(value).toContain(`[REDACTED:${kind}]`);
  });

  it.each([
    ["account", "https://hashscan.io/mainnet/account/0.0.1040977"],
    ["transaction", "https://hashscan.io/mainnet/transaction/0.0.1234567-123-123"],
  ])("redacts a short Hedera %s id in an explorer link", (route, input) => {
    expect(scrubPiiString(input).value).toBe(
      `https://hashscan.io/mainnet/${route}/[REDACTED:explorer_url]`,
    );
  });

  it("keeps the explorer host and route so the event stays useful", () => {
    expect(scrubPiiString(`https://etherscan.io/tx/${EVM_HASH}`).value).toBe(
      "https://etherscan.io/tx/[REDACTED:explorer_url]",
    );
  });

  it("keeps the currency of a Ledger account id", () => {
    expect(scrubPiiString(LEDGER_ACCOUNT_ID).value).toBe(
      "js:2:ethereum:[REDACTED:ledger_account_id]:",
    );
  });

  it("redacts a Ledger account id with a short address", () => {
    expect(scrubPiiString("js:2:hedera:0.0.1040977:hederaBip44").value).toBe(
      "js:2:hedera:[REDACTED:ledger_account_id]:hederaBip44",
    );
  });

  it.each([
    ["a short hex value", "0x1234"],
    ["a version", "3.105.0"],
    ["an event name", "button_clicked2"],
    ["a token id", "ethereum/erc20/usd_tether__erc20_"],
    ["a token id that contains a contract address", `sui/coin/0x${"a".repeat(64)}::usdc::USDC`],
    ["a time", "time:10:30:00:12"],
    ["an account id that the app already redacted", "js:2:ethereum:[redacted]:"],
    ["a UUID", "3f2b8c1e-9d4a-4e6b-8f1a-2c3d4e5f6a7b"],
    [
      "a firmware hash without a prefix",
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ],
    ["a support link", "https://support.ledger.com/article/360017582793"],
    ["a short explorer path", "https://etherscan.io/address/"],
    ["an app route under account", "https://ledger.com/account/settings"],
  ])("keeps %s", (_label, input) => {
    expect(scrubPiiString(input)).toEqual({ value: input, kinds: [] });
  });

  it.each([
    ["a long word", "a".repeat(50_000)],
    ["a long run of punctuation", "a.".repeat(25_000)],
    ["a long run of link starts", "https://".repeat(6_250)],
  ])("scans %s in linear time", (_label, input) => {
    const start = Date.now();

    scrubPiiString(input);

    expect(Date.now() - start).toBeLessThan(100);
  });
});

describe("scrubPii", () => {
  it("reports the path and kind of each finding without the value", () => {
    const { findings } = scrubPii({ flow: "send", details: { to: EVM_ADDRESS } }, "properties");

    expect(findings).toEqual([{ path: "properties.details.to", kind: "evm_address" }]);
  });

  it("redacts values inside arrays", () => {
    const { value, findings } = scrubPii({ recipients: ["ok", BTC_BECH32] });

    expect(value).toEqual({ recipients: ["ok", "[REDACTED:bech32_address]"] });
    expect(findings).toEqual([{ path: "recipients[1]", kind: "bech32_address" }]);
  });

  it("redacts any value under a sensitive key, whatever its shape", () => {
    const { value, findings } = scrubPii({
      freshAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      txPayload: { signature: "deadbeef", rawData: { fee: 1 } },
    });

    expect(value).toEqual({
      freshAddress: "[REDACTED:sensitive_key]",
      txPayload: { signature: "[REDACTED:sensitive_key]", rawData: "[REDACTED:sensitive_key]" },
    });
    expect(findings.map(finding => finding.path)).toEqual([
      "freshAddress",
      "txPayload.signature",
      "txPayload.rawData",
    ]);
  });

  it("redacts property names", () => {
    const { value, findings } = scrubPii({ "satoshi@example.com": EVM_ADDRESS });

    expect(value).toEqual({ "[REDACTED:email]": "[REDACTED:evm_address]" });
    expect(findings).toEqual([
      { path: "[REDACTED:email]", kind: "email" },
      { path: "[REDACTED:email]", kind: "evm_address" },
    ]);
  });

  it("keeps empty and boolean values under a sensitive key", () => {
    const props = { address: "", email: false, signature: null };

    expect(scrubPii(props)).toEqual({ value: props, findings: [] });
  });

  it("returns the same object when nothing is redacted", () => {
    const props = { flow: "send", nested: { count: 2 }, list: ["a"] };

    expect(scrubPii(props).value).toBe(props);
  });

  it("does not mutate the input", () => {
    const props = { nested: { to: EVM_ADDRESS } };

    scrubPii(props);

    expect(props.nested.to).toBe(EVM_ADDRESS);
  });

  it("keeps class instances without personal data as they are", () => {
    const date = new Date(0);

    expect(scrubPii({ date }).value.date).toBe(date);
  });

  it("redacts bytes under a sensitive key", () => {
    const { value, findings } = scrubPii({ signature: new Uint8Array([222, 173, 190, 239]) });

    expect(value).toEqual({ signature: "[REDACTED:sensitive_key]" });
    expect(findings).toEqual([{ path: "signature", kind: "sensitive_key" }]);
  });

  it("redacts the fields of class instances", () => {
    class Recipient {
      constructor(readonly to: string) {}
    }

    const { value, findings } = scrubPii({ recipient: new Recipient(EVM_ADDRESS) });

    expect(value).toEqual({ recipient: { to: "[REDACTED:evm_address]" } });
    expect(findings).toEqual([{ path: "recipient.to", kind: "evm_address" }]);
  });

  it("redacts what is below the maximum depth", () => {
    let nested: Record<string, unknown> = { address: EVM_ADDRESS };
    for (let level = 0; level < 8; level++) nested = { nested };

    const { value, findings } = scrubPii(nested);

    expect(JSON.stringify(value)).not.toContain(EVM_ADDRESS);
    expect(findings).toEqual([
      { path: "nested.nested.nested.nested.nested.nested.nested.nested", kind: "max_depth" },
    ]);
  });

  it("stops at the maximum depth so that circular objects do not loop", () => {
    const circular: Record<string, unknown> = { name: "loop" };
    circular.self = circular;

    expect(scrubPii(circular).findings).toEqual([
      { path: "self.self.self.self.self.self.self.self", kind: "max_depth" },
    ]);
  });
});
