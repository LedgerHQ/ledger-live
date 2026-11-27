import { TypedDataEncoder, Wallet } from "ethers";
import { PLACE_ORDER_SIGNED_AT_MS } from "../__fixtures__/placeOrderTypedData";
import { SELL_POSITION_TYPED_DATA } from "../__fixtures__/sellPositionTypedData";
import { sellPositionShares } from "../order";
import { sellPositionTypedDataJsonSchema } from "../sellPositionTypedData";
import { isTypedDataSigner } from "../typedData";

type SellPositionTypedData = typeof SELL_POSITION_TYPED_DATA;

const parse = (typedData: unknown) =>
  sellPositionTypedDataJsonSchema.safeParse(JSON.stringify(typedData));

const withMessage = (message: object) => ({
  ...SELL_POSITION_TYPED_DATA,
  message: { ...SELL_POSITION_TYPED_DATA.message, ...message },
});

const withSaleFields = (fields: SellPositionTypedData["types"]["SellPosition"]) => ({
  ...SELL_POSITION_TYPED_DATA,
  types: { ...SELL_POSITION_TYPED_DATA.types, SellPosition: fields },
});

const OTHER_WALLET = `0x${"22".repeat(20)}`;
const NOW_SECONDS = PLACE_ORDER_SIGNED_AT_MS / 1000;

describe("sellPositionTypedDataJsonSchema", () => {
  beforeEach(() => jest.spyOn(Date, "now").mockReturnValue(PLACE_ORDER_SIGNED_AT_MS));
  afterEach(() => jest.restoreAllMocks());

  it("accepts a sale paid in pUSD to the trading wallet it sells from, on Polygon", () => {
    expect(parse(SELL_POSITION_TYPED_DATA)).toEqual({
      success: true,
      data: {
        ...SELL_POSITION_TYPED_DATA,
        domain: { ...SELL_POSITION_TYPED_DATA.domain, chainId: 137 },
      },
    });
  });

  it("keeps the digest the live app checks the signature against", () => {
    const wallet = new Wallet(`0x${"11".repeat(32)}`);
    const { domain, message } = SELL_POSITION_TYPED_DATA;
    const { EIP712Domain: _domainType, ...types } = SELL_POSITION_TYPED_DATA.types;
    const signature = wallet.signingKey.sign(
      TypedDataEncoder.hash(domain, types, message),
    ).serialized;

    const parsed = sellPositionTypedDataJsonSchema.parse(JSON.stringify(SELL_POSITION_TYPED_DATA));

    expect(isTypedDataSigner(wallet.address, parsed, signature)).toBe(true);
  });

  it("compares the addresses whatever their case", () => {
    const { proxyWallet, dstTokenAddress } = SELL_POSITION_TYPED_DATA.message;
    const typedData = withMessage({
      dstWalletAddress: proxyWallet.toLowerCase(),
      dstTokenAddress: dstTokenAddress.toLowerCase(),
    });

    expect(parse(typedData).success).toBe(true);
  });

  it.each([
    [
      "another domain name",
      { ...SELL_POSITION_TYPED_DATA, domain: { ...SELL_POSITION_TYPED_DATA.domain, name: "X" } },
    ],
    ["another primary type", { ...SELL_POSITION_TYPED_DATA, primaryType: "PlaceOrder" }],
    [
      "fields in another order",
      withSaleFields([
        SELL_POSITION_TYPED_DATA.types.SellPosition[1],
        SELL_POSITION_TYPED_DATA.types.SellPosition[0],
        ...SELL_POSITION_TYPED_DATA.types.SellPosition.slice(2),
      ]),
    ],
    [
      "a missing field",
      withSaleFields(
        SELL_POSITION_TYPED_DATA.types.SellPosition.filter(
          field => field.name !== "dstWalletAddress",
        ),
      ),
    ],
    ["an extra message value", withMessage({ recipient: OTHER_WALLET })],
    ["a buy", withMessage({ side: "BUY" })],
    ["a sale that may fill partly", withMessage({ orderType: "FAK" })],
    ["nothing to sell", withMessage({ amount: "0" })],
    ["proceeds sent to another wallet", withMessage({ dstWalletAddress: OTHER_WALLET })],
    ["proceeds sent to the caller by default", withMessage({ dstWalletAddress: "" })],
    ["no trading wallet", withMessage({ proxyWallet: "", dstWalletAddress: "" })],
    ["proceeds paid in another token", withMessage({ dstTokenAddress: OTHER_WALLET })],
    ["proceeds paid in the default token", withMessage({ dstTokenAddress: "" })],
    ["proceeds paid on another chain", withMessage({ dstTokenChainId: "1" })],
    ["proceeds paid on the default chain", withMessage({ dstTokenChainId: "" })],
    [
      "a trading wallet that isn't an address",
      withMessage({ proxyWallet: "0xabc", dstWalletAddress: "0xabc" }),
    ],
    ["a sale that already expired", withMessage({ expiration: String(NOW_SECONDS) })],
    [
      "a sale that expires more than 300 s ahead",
      withMessage({ expiration: String(NOW_SECONDS + 301) }),
    ],
  ])("refuses %s", (_case, typedData) => {
    expect(parse(typedData).success).toBe(false);
  });
});

describe("a checked sale", () => {
  beforeEach(() => jest.spyOn(Date, "now").mockReturnValue(PLACE_ORDER_SIGNED_AT_MS));
  afterEach(() => jest.restoreAllMocks());

  const checkedSale = () =>
    sellPositionTypedDataJsonSchema.parse(JSON.stringify(SELL_POSITION_TYPED_DATA));

  it("takes the shares from the signed sale", () => {
    expect(sellPositionShares(checkedSale())).toBe(16.12);
  });
});
