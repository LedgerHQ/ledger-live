import type {
  RentPayment,
  SponsoredFeeAsset,
} from "../../../../bridge/generic-coin-framework/sponsored";

export const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

export const USDT_FEE_ASSET: SponsoredFeeAsset = {
  type: "trc20",
  assetReference: USDT_CONTRACT,
  name: "Tether USD",
  unit: { name: "USDT", code: "USDT", magnitude: 6 },
};

export const USDT_RENT_PAYMENT: RentPayment = { asset: USDT_FEE_ASSET, amount: 3_200_000n };
