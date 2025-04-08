import { OperationType } from "@ledgerhq/types-live";
import * as KindMappers from "./export";
import { toOperationType } from "./helper";

describe("Testing kind helper", () => {
  const operationTypeByKind = new Map<string, OperationType>();
  KindMappers.default.forEach(mapper => {
    operationTypeByKind.set(mapper.kind, mapper.operationType);
  });

  it.each(Array.from(operationTypeByKind.keys()))(
    "should map the kind %s to the correct operation type",
    kind => {
      const operationType = toOperationType(kind);
      expect(operationType).toEqual(operationTypeByKind.get(kind));
    },
  );

  it.each(["", "unknown", "transfer.psbt"])("should throw an error on unknown kind [%s]", kind => {
    expect(() => toOperationType(kind)).toThrow(`${kind} is not supported by OperationType`);
  });
});
