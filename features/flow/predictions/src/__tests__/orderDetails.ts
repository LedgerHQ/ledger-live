import type { PredictionsTypedData } from "@features/platform-predictions";
import type { PredictionsOrderDetails } from "../predictionsOrderStore.internals";

export const ORDER_IMAGE_URL = "https://polymarket-upload.s3.us-east-2.amazonaws.com/jensen.png";

/** A $5 buy of "Yes", as the order sheet gets it once signed. */
export const ORDER_DETAILS: PredictionsOrderDetails = {
  display: {
    marketTitle: "Will Jensen Huang rejoin NVIDIA by December 31, 2027?",
    outcomeLabel: "Yes",
    imageUrl: ORDER_IMAGE_URL,
  },
  amountPaid: 5,
};

/** The signed order behind ORDER_DETAILS: MoonPay's amount, $5 scaled to 6 decimals. */
export const ORDER_TYPED_DATA: PredictionsTypedData = {
  domain: { name: "BoxPolymarketPlaceOrder", version: "1", chainId: 137 },
  types: { EIP712Domain: [] },
  primaryType: "PlaceOrder",
  message: { amount: "5000000" },
};
