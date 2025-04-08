import { OperationType } from "@ledgerhq/types-live";
import { OperationTypeMapper } from "../type";

export const mapper: OperationTypeMapper = {
  kind: "stake.withdraw",
  operationType: "IN" as OperationType,
};
