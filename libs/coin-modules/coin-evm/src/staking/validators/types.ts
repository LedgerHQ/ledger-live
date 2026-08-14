import type { Cursor, Page } from "@ledgerhq/coin-module-framework/api/index";
import type { Validator } from "@ledgerhq/coin-module-framework/api/types";

export type ValidatorApi = {
  fetchValidators: (currencyId: string, cursor?: Cursor) => Promise<Page<Validator>>;
};
