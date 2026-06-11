import type { Cursor, Page } from "@ledgerhq/coin-module-framework/api/index";
import type { StakingValidatorItem } from "@ledgerhq/types-live";

export type ValidatorApi = {
  fetchValidators: (currencyId: string, cursor?: Cursor) => Promise<Page<StakingValidatorItem>>;
};
