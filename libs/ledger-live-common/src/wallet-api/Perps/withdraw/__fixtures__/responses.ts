// TODO(LIVE-39366): the submit and error bodies are still placeholders.

// Quote `customFields` for the Mayan route: root typed data, message under `value`.
export const mayanWithdrawPayload = {
  ledgerIdFrom: "hypercore",
  ledgerIdTo: "ethereum",
  amountFrom: 154.16,
  amountTo: 0.0624449292776733,
  payoutAddress: "0x8e364a2d655FcB4D344cccb5C2259e7902fF6A1d",
  refundAddress: "0x8e364a2d655FcB4D344cccb5C2259e7902fF6A1d",
  slippage: 2.0,
  swapId: "cafd5646-9e7d-42e7-929f-f987b04a03d8",
  typedData: {
    domain: {
      name: "HyperliquidSignTransaction",
      version: "1",
      chainId: 42161,
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    types: {
      "HyperliquidTransaction:SendToEvmWithData": [
        { name: "hyperliquidChain", type: "string" },
        { name: "token", type: "string" },
        { name: "amount", type: "string" },
        { name: "sourceDex", type: "string" },
        { name: "destinationRecipient", type: "string" },
        { name: "addressEncoding", type: "string" },
        { name: "destinationChainId", type: "uint32" },
        { name: "gasLimit", type: "uint64" },
        { name: "data", type: "bytes" },
        { name: "nonce", type: "uint64" },
      ],
    },
    value: {
      hyperliquidChain: "Mainnet",
      token: "USDC",
      amount: "154.16",
      sourceDex: "spot",
      destinationRecipient: "0xe087f468efaece33b6b9b15c9448b8268bc3efe4",
      addressEncoding: "hex",
      destinationChainId: 3,
      gasLimit: 200000,
      data: "0x0100",
      nonce: 1792578933186,
    },
  },
  "@type": "SwapkitHyperliquidWithdrawCustomFields",
};

// Quote `customFields` for the NEAR route: a Hyperliquid action with its EIP-712 typed data.
export const nearWithdrawPayload = {
  ledgerIdFrom: "hypercore",
  ledgerIdTo: "ethereum",
  amountFrom: 115.62,
  amountTo: 0.045365178839144,
  payoutAddress: "0x8e364a2d655FcB4D344cccb5C2259e7902fF6A1d",
  refundAddress: "0x8e364a2d655FcB4D344cccb5C2259e7902fF6A1d",
  slippage: 2.0,
  swapId: "644f9951-4ba0-4c78-ba8b-ba8c070f053c",
  hyperCoreAction: {
    typedData: {
      domain: {
        name: "HyperliquidSignTransaction",
        version: "1",
        chainId: 42161,
        verifyingContract: "0x0000000000000000000000000000000000000000",
      },
      primaryType: "HyperliquidTransaction:SendAsset",
      types: {
        "HyperliquidTransaction:SendAsset": [
          { name: "hyperliquidChain", type: "string" },
          { name: "destination", type: "string" },
          { name: "sourceDex", type: "string" },
          { name: "destinationDex", type: "string" },
          { name: "token", type: "string" },
          { name: "amount", type: "string" },
          { name: "fromSubAccount", type: "string" },
          { name: "nonce", type: "uint64" },
        ],
      },
      message: {
        hyperliquidChain: "Mainnet",
        destination: "0x6cF4625FC05Ea64459966436454ea4dF16A64567",
        sourceDex: "spot",
        destinationDex: "spot",
        token: "USDC:0x6d1e7cde53ba9467b783cb7c530ce054",
        amount: "115.62",
        fromSubAccount: "",
        nonce: 1792595201959,
      },
    },
    action: {
      type: "sendAsset",
      hyperliquidChain: "Mainnet",
      signatureChainId: "0xa4b1",
      destination: "0x6cF4625FC05Ea64459966436454ea4dF16A64567",
      sourceDex: "spot",
      destinationDex: "spot",
      token: "USDC:0x6d1e7cde53ba9467b783cb7c530ce054",
      amount: "115.62",
      fromSubAccount: "",
      nonce: 1792595201959,
    },
    submitTo: "https://api.hyperliquid.xyz/exchange",
  },
  "@type": "SwapkitHyperliquidWithdrawCustomFields",
};

export const submitResponse = {
  swapId: "swap-mayan-1",
};

export const errorBody = (code: string, additionalFields?: Record<string, unknown>) => ({
  code,
  message: `${code} message`,
  ...(additionalFields ? { additionalFields } : {}),
});
