import type { Cursor, Page } from "@ledgerhq/coin-module-framework/api/index";
import type { Validator } from "@ledgerhq/coin-module-framework/api/types";
import type { EvmConfigInfo } from "../../config";

export type ValidatorApi = {
  fetchValidators: (
    config: EvmConfigInfo,
    currencyId: string,
    cursor?: Cursor,
  ) => Promise<Page<Validator>>;
};
