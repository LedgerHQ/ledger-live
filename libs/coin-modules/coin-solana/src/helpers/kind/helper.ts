import { OperationType } from "@ledgerhq/types-live";
import * as KindMappers from "./export";

const OPERATION_TYPE_BY_KIND = new Map<string, OperationType>();
for (let index = 0; index < KindMappers.default.length; index++) {
  const mapper = KindMappers.default[index];
  OPERATION_TYPE_BY_KIND.set(mapper.kind, mapper.operationType);
}

export function toOperationType(kind: string): OperationType {
  const operationType = OPERATION_TYPE_BY_KIND.get(kind);
  if (operationType) {
    return operationType;
  }

  throw new Error(`${kind} is not supported by OperationType`);
}
