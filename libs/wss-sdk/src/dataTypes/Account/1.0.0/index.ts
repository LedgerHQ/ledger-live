import { getAccountId } from "./logic";
import { schemaAccountMetadata } from "./schemas";

export const BP_1_0_0 = {
  getItemId: getAccountId,
  itemSchema: schemaAccountMetadata,
};
