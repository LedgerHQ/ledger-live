// TODO(LIVE-39366): placeholder fixtures, replace with real SwapKit responses.

export const currenciesResponse = {
  currencies: [{ id: "ethereum" }, { id: "bitcoin" }, { id: "solana" }],
};

export const quoteResponse = {
  quoteId: "quote-1",
  amountTo: "0.3",
  payoutNetworkFees: "0.0004",
  expiry: 1792000000000,
  defaultSlippage: 2,
};

const typedData = {
  domain: { name: "HyperliquidSignTransaction", version: "1", chainId: 42161 },
  types: {
    EIP712Domain: [{ name: "name", type: "string" }],
    "HyperliquidTransaction:SendAsset": [{ name: "amount", type: "string" }],
  },
  primaryType: "HyperliquidTransaction:SendAsset",
  message: { amount: "500" },
};

export const mayanPayloadResponse = {
  swapId: "swap-mayan-1",
  typedData,
};

export const nearPayloadResponse = {
  swapId: "swap-near-1",
  hyperCoreAction: {
    typedData,
    action: { type: "sendAsset", destination: "0xdeposit", amount: "500" },
    nonce: 1792000000000,
  },
};

export const submitResponse = {
  swapId: "swap-mayan-1",
};

export const statusResponse = {
  swapId: "swap-mayan-1",
  status: "PENDING",
  payoutNetworkFees: "0.0004",
  payinTransactionId: "0xpayin",
};

export const finishedStatusResponse = {
  ...statusResponse,
  status: "FINISHED",
  payoutTransactionId: "0xpayout",
};

export const errorBody = (code: string, additionalFields?: Record<string, unknown>) => ({
  code,
  message: `${code} message`,
  ...(additionalFields ? { additionalFields } : {}),
});
