import { TypedDataEncoder, Wallet } from "ethers";
import {
  PLACE_ORDER_SIGNED_AT_MS,
  PLACE_ORDER_TYPED_DATA,
} from "../__fixtures__/placeOrderTypedData";
import { placeOrderTypedDataJsonSchema } from "../placeOrderTypedData";
import { isTypedDataSigner } from "../typedData";

type PlaceOrderTypedData = typeof PLACE_ORDER_TYPED_DATA;

const parse = (typedData: unknown) =>
  placeOrderTypedDataJsonSchema.safeParse(JSON.stringify(typedData));

const withDomain = (domain: object) => ({
  ...PLACE_ORDER_TYPED_DATA,
  domain: { ...PLACE_ORDER_TYPED_DATA.domain, ...domain },
});

const withMessage = (message: object) => ({
  ...PLACE_ORDER_TYPED_DATA,
  message: { ...PLACE_ORDER_TYPED_DATA.message, ...message },
});

const withOrderFields = (fields: PlaceOrderTypedData["types"]["PlaceOrder"]) => ({
  ...PLACE_ORDER_TYPED_DATA,
  types: { ...PLACE_ORDER_TYPED_DATA.types, PlaceOrder: fields },
});

const NOW_SECONDS = PLACE_ORDER_SIGNED_AT_MS / 1000;

describe("placeOrderTypedDataJsonSchema", () => {
  beforeEach(() => jest.spyOn(Date, "now").mockReturnValue(PLACE_ORDER_SIGNED_AT_MS));
  afterEach(() => jest.restoreAllMocks());

  it("accepts the live app's buy order authorization, on Polygon", () => {
    expect(parse(PLACE_ORDER_TYPED_DATA)).toEqual({
      success: true,
      data: {
        ...PLACE_ORDER_TYPED_DATA,
        domain: { ...PLACE_ORDER_TYPED_DATA.domain, chainId: 137 },
      },
    });
  });

  it("keeps the digest the live app checks the signature against", () => {
    const wallet = new Wallet(`0x${"11".repeat(32)}`);
    const { EIP712Domain: _domainType, ...types } = PLACE_ORDER_TYPED_DATA.types;
    const signature = wallet.signingKey.sign(
      TypedDataEncoder.hash(PLACE_ORDER_TYPED_DATA.domain, types, PLACE_ORDER_TYPED_DATA.message),
    ).serialized;

    const parsed = placeOrderTypedDataJsonSchema.parse(JSON.stringify(PLACE_ORDER_TYPED_DATA));

    expect(isTypedDataSigner(wallet.address, parsed, signature)).toBe(true);
  });

  it("accepts a numeric chain id", () => {
    expect(parse(withDomain({ chainId: 137 })).success).toBe(true);
  });

  it("accepts safe integer amounts", () => {
    const typedData = withMessage({ amount: 2_000_000, slippage: 100, expiration: 1_790_000_000 });

    expect(parse(typedData).success).toBe(true);
  });

  it("accepts an order that expires in 300 s", () => {
    expect(parse(withMessage({ expiration: String(NOW_SECONDS + 300) })).success).toBe(true);
  });

  it("refuses what isn't JSON", () => {
    expect(placeOrderTypedDataJsonSchema.safeParse("{").success).toBe(false);
  });

  it.each([
    ["another domain name", withDomain({ name: "Ledger Predictions" })],
    ["another version", withDomain({ version: "2" })],
    ["another chain", withDomain({ chainId: "1" })],
    ["a verifying contract", withDomain({ verifyingContract: `0x${"11".repeat(20)}` })],
    ["another primary type", { ...PLACE_ORDER_TYPED_DATA, primaryType: "Withdraw" }],
    [
      "another type",
      {
        ...PLACE_ORDER_TYPED_DATA,
        types: { ...PLACE_ORDER_TYPED_DATA.types, Withdraw: [{ name: "to", type: "address" }] },
      },
    ],
    [
      "a domain type that doesn't describe the domain",
      {
        ...PLACE_ORDER_TYPED_DATA,
        types: {
          ...PLACE_ORDER_TYPED_DATA.types,
          EIP712Domain: [{ name: "name", type: "string" }],
        },
      },
    ],
    [
      "an extra field",
      withOrderFields([
        ...PLACE_ORDER_TYPED_DATA.types.PlaceOrder,
        { name: "recipient", type: "address" },
      ]),
    ],
    [
      "a field of another type",
      withOrderFields(
        PLACE_ORDER_TYPED_DATA.types.PlaceOrder.map(field =>
          field.name === "amount" ? { ...field, type: "int256" } : field,
        ),
      ),
    ],
    [
      "fields in another order",
      withOrderFields([
        PLACE_ORDER_TYPED_DATA.types.PlaceOrder[1],
        PLACE_ORDER_TYPED_DATA.types.PlaceOrder[0],
        ...PLACE_ORDER_TYPED_DATA.types.PlaceOrder.slice(2),
      ]),
    ],
    ["an extra message value", withMessage({ recipient: `0x${"11".repeat(20)}` })],
    ["a negative amount", withMessage({ amount: "-1" })],
    ["a fractional amount", withMessage({ amount: 1.5 })],
    ["an amount too large for a uint256", withMessage({ amount: (2n ** 256n).toString() })],
    ["a slippage too large for a uint256", withMessage({ slippage: (2n ** 256n).toString() })],
    ["an unknown side", withMessage({ side: "MINT" })],
    ["a sell order", withMessage({ side: "SELL" })],
    ["an order that may fill partly", withMessage({ orderType: "FAK" })],
    ["a token id that isn't a number", withMessage({ tokenID: "0xabc" })],
    ["an order that already expired", withMessage({ expiration: String(NOW_SECONDS) })],
    [
      "an order that expires more than 300 s ahead",
      withMessage({ expiration: String(NOW_SECONDS + 301) }),
    ],
    ["an expiration past 2^53", withMessage({ expiration: "9".repeat(78) })],
  ])("refuses %s", (_case, typedData) => {
    expect(parse(typedData).success).toBe(false);
  });
});
