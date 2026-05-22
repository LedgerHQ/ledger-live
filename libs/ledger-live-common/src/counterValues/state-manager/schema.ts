import { z } from "zod";

export enum Tags {
  CounterValueIdsSortedByMarketCap = "CounterValueIdsSortedByMarketCap",
  UsdToFiatRate = "UsdToFiatRate",
}

export const defaultCounterValueIdsSortedByMarketCap: string[] = [];

export const counterValueIdsSortedByMarketCapSchema = z.array(z.string().min(1));

export type CounterValueIdsSortedByMarketCap = z.infer<
  typeof counterValueIdsSortedByMarketCapSchema
>;

export const idsMock: CounterValueIdsSortedByMarketCap = ["bitcoin", "ethereum"];

export const spotSimpleResponseSchema = z.record(z.string(), z.number());

export type SpotSimpleResponse = z.infer<typeof spotSimpleResponseSchema>;

export const spotSimpleResponseMock: SpotSimpleResponse = {
  USD: 0.9,
};
