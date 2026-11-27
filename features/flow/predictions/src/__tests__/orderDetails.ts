import type { PredictionsTypedData } from "@features/platform-predictions";
import type { PredictionsOrderDetails } from "../predictionsOrderStore.internals";

export const ORDER_IMAGE_URL = "https://polymarket-upload.s3.us-east-2.amazonaws.com/jensen.png";

export const ORDER_DETAILS: PredictionsOrderDetails = {
  side: "buy",
  display: {
    marketTitle: "Will Jensen Huang rejoin NVIDIA by December 31, 2027?",
    outcomeLabel: "Yes",
    imageUrl: ORDER_IMAGE_URL,
  },
  amountPaid: 5,
};

/** MoonPay's amount: $5 scaled to 6 decimals. */
export const ORDER_TYPED_DATA: PredictionsTypedData = {
  domain: { name: "BoxPolymarketPlaceOrder", version: "1", chainId: 137 },
  types: { EIP712Domain: [] },
  primaryType: "PlaceOrder",
  message: { amount: "5000000" },
};

export const SALE_DETAILS: PredictionsOrderDetails = {
  side: "sale",
  display: ORDER_DETAILS.display,
  shares: 16.12,
};

/** MoonPay's amount: 16.12 shares scaled to 6 decimals. */
export const SALE_TYPED_DATA: PredictionsTypedData = {
  domain: { name: "BoxPolymarketSellPosition", version: "1", chainId: 137 },
  types: { EIP712Domain: [] },
  primaryType: "SellPosition",
  message: { amount: "16120000" },
};
