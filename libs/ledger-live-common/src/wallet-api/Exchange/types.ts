export const methodIds = ["custom.exchange.start", "custom.exchange.complete"] as const;

export type MethodIds = (typeof methodIds)[number];

export type LoggerParams = {
  message: string;
};

export type LoggerResponse = void;

export enum ExchangeType {
  SWAP = 0x00,
  SELL = 0x01,
  FUND = 0x02,
}
