/** When the live app signs PLACE_ORDER_TYPED_DATA: it expires a minute later. */
export const PLACE_ORDER_SIGNED_AT_MS = 1_789_999_940_000;

/** A buy order authorization, as the live app builds it before sending it as JSON. */
export const PLACE_ORDER_TYPED_DATA = {
  domain: { name: "BoxPolymarketPlaceOrder", version: "1", chainId: "137" },
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
    ],
    PlaceOrder: [
      { name: "tokenID", type: "string" },
      { name: "side", type: "string" },
      { name: "orderType", type: "string" },
      { name: "amount", type: "uint256" },
      { name: "tickSize", type: "string" },
      { name: "negRisk", type: "bool" },
      { name: "slippage", type: "uint256" },
      { name: "expiration", type: "uint256" },
    ],
  },
  primaryType: "PlaceOrder",
  message: {
    tokenID: "90234889617199443673709150877675264639",
    side: "BUY",
    orderType: "FOK",
    amount: "2000000",
    tickSize: "0.01",
    negRisk: true,
    slippage: "100",
    expiration: "1790000000",
  },
};
