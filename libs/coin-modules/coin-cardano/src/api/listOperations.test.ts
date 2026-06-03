import { createApi } from ".";
import { type CardanoConfig } from "../config";
import type { ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/index";

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };

describe("listOperations", () => {
  it("throws an unsupported error", () => {
    const api = createApi(config, "cardano");

    expect(() => api.listOperations("address", {} as ListOperationsOptions)).toThrow(
      "listOperations is not supported",
    );
  });
});
