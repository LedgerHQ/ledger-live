// TODO(LIVE-39366): placeholder fixtures, replace with real SwapKit responses.

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

export const errorBody = (code: string, additionalFields?: Record<string, unknown>) => ({
  code,
  message: `${code} message`,
  ...(additionalFields ? { additionalFields } : {}),
});
