import { OperationType } from "@ledgerhq/types-live";
import { OperationTypeMapper } from "../type";

export const mapper: OperationTypeMapper = {
  kind: "token.createATA",
  operationType: "OPT_IN" as OperationType,
};
