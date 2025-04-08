import { OperationType } from "@ledgerhq/types-live";
import { OperationTypeMapper } from "../type";

export const mapper: OperationTypeMapper = {
  kind: "stake.split",
  operationType: "OUT" as OperationType,
};
