import { z } from "zod";

export enum Tags {
  CounterValueIdsSortedByMarketCap = "CounterValueIdsSortedByMarketCap",
}

export const defaultCounterValueIdsSortedByMarketCap: string[] = [];

export const counterValueIdsSortedByMarketCapSchema = z.array(z.string().min(1));

export type CounterValueIdsSortedByMarketCap = z.infer<
  typeof counterValueIdsSortedByMarketCapSchema
>;

export const idsMock: CounterValueIdsSortedByMarketCap = ["bitcoin", "ethereum"];
