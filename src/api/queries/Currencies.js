//@flow
import Query from "../../restlay/Query";
import schema from "../../data/schema";
import type { Currency } from "../../data/types";

type Input = void;
type Response = Currency[];

// Fetch all currencies
export default class CurrenciesQuery extends Query<Input, Response> {
  uri = "/currencies";
  responseSchema = [schema.Currency];
  cacheMaxAge = 60;
}
