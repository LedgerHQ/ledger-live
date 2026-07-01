import type {
  AssetInfo,
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { buildCeloTxParams } from "./buildCeloTxParams";

const SENDER = "0xAAAa0000000000000000000000000000000000aA";
const RECIPIENT = "0x1234567890123456789012345678901234567890";
const USDC_CONTRACT = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";

const makeIntent = (
  asset: AssetInfo,
  overrides: Partial<TransactionIntent<MemoNotSupported, BufferTxData>> = {},
): TransactionIntent<MemoNotSupported, BufferTxData> => ({
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: 1000n,
  asset,
  data: { type: "buffer", value: Buffer.from([]) },
  ...overrides,
});

describe("buildCeloTxParams", () => {
  it("builds a native CELO send: to recipient, value = amount, empty calldata", () => {
    const params = buildCeloTxParams(makeIntent({ type: "native" }));
    expect(params.to).toBe(RECIPIENT);
    expect(params.value).toBe(1000n);
    expect(params.data).toBe("0x");
    expect(params.feeCurrency).toBeUndefined();
  });

  it("builds an ERC-20 transfer: to token contract, value 0, transfer() calldata", () => {
    const params = buildCeloTxParams(makeIntent({ type: "erc20", assetReference: USDC_CONTRACT }));
    expect(params.to).toBe(USDC_CONTRACT);
    expect(params.value).toBe(0n);
    // transfer(address,uint256) selector
    expect(params.data.startsWith("0xa9059cbb")).toBe(true);
  });

  it("attaches feeCurrency to the params when one is provided", () => {
    const params = buildCeloTxParams(makeIntent({ type: "native" }), USDC_ADAPTER);
    expect(params.feeCurrency).toBe(USDC_ADAPTER);
  });

  it("uses an explicit data payload verbatim when present (contract interaction)", () => {
    const params = buildCeloTxParams(
      makeIntent(
        { type: "native" },
        { data: { type: "buffer", value: Buffer.from("deadbeef", "hex") } },
      ),
    );
    expect(params.data).toBe("0xdeadbeef");
  });

  it("throws when a token intent is missing its asset contract address", () => {
    expect(() => buildCeloTxParams(makeIntent({ type: "erc20" }))).toThrow(/assetReference/);
  });
});
