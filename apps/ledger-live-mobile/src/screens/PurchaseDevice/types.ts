export type PurchaseMessage = {
  type: "ledgerLiveOrderSuccess" | "ledgerLiveOrderFail";
  value?: {
    deviceId: "nanoS" | "nanoSP" | "nanoX" | string;
    price: number;
    currency: string;
  };
};
