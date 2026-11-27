const PROXY_WALLET = "0x6e0c80c90ea6c15917308F820Eac91Ce2724B5b5";

/** Signed at `PLACE_ORDER_SIGNED_AT_MS`: it expires a minute later. */
export const SELL_POSITION_TYPED_DATA = {
  domain: { name: "BoxPolymarketSellPosition", version: "1", chainId: "137" },
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
    ],
    SellPosition: [
      { name: "proxyWallet", type: "string" },
      { name: "tokenID", type: "string" },
      { name: "side", type: "string" },
      { name: "orderType", type: "string" },
      { name: "tickSize", type: "string" },
      { name: "negRisk", type: "bool" },
      { name: "amount", type: "uint256" },
      { name: "slippage", type: "uint256" },
      { name: "dstTokenAddress", type: "string" },
      { name: "dstTokenChainId", type: "string" },
      { name: "dstWalletAddress", type: "string" },
      { name: "expiration", type: "uint256" },
    ],
  },
  primaryType: "SellPosition",
  message: {
    proxyWallet: PROXY_WALLET,
    tokenID: "90234889617199443673709150877675264639",
    side: "SELL",
    orderType: "FOK",
    tickSize: "0.01",
    negRisk: true,
    amount: "16120000",
    slippage: "100",
    dstTokenAddress: "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB", // gitleaks:allow
    dstTokenChainId: "137",
    dstWalletAddress: PROXY_WALLET,
    expiration: "1790000000",
  },
};
