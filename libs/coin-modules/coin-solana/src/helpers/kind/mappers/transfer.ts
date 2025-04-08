import { OperationType } from "@ledgerhq/types-live";
import { OperationTypeMapper } from "../type";

export const mapper: OperationTypeMapper = {
  kind: "transfer",
  operationType: "OUT" as OperationType,
};
