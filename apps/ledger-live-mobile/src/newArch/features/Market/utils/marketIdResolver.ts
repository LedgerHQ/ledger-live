// @FIXME workaround for main tokens
const tokenToMarketIdMap: Record<string, string> = {
  "ethereum/erc20/usd_tether__erc20_": "tether",
  "ethereum/erc20/usd__coin": "usd-coin",
};

const resolveMarketId = (id: string): string => {
  return tokenToMarketIdMap[id] || id;
};

export { resolveMarketId, tokenToMarketIdMap };
