import { OperationType } from "@ledgerhq/types-live";
import { OperationTypeMapper } from "../type";

export const mapper: OperationTypeMapper = {
  kind: "token.transfer",
  operationType: "FEES" as OperationType,
};
