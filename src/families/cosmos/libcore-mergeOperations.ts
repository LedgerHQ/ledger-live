import invariant from "invariant";
import type { Operation } from "../../types";

const mergeOperations = (operations: Operation[]): Operation => {
  const feeOp = operations.find((op) => op.type === "FEES");
  const otherOps = operations.filter((op) => op !== feeOp);

  if (otherOps.length === 0) {
    invariant(feeOp, "fee op is necessary if no other ops exists");
    return feeOp as Operation;
  }

  const union: Operation = { ...otherOps[0] };
  // remove the "-0" part
  union.id = union.id.split("-").slice(0, 3).join("-");

  if (feeOp) {
    union.fee = feeOp.value;

    if (union.type === "OUT") {
      union.value = union.value.plus(feeOp.value);
    } else {
      union.value = feeOp.value;
    }
  }

  const extra = { ...union.extra };
  delete extra.id;

  // accumulate validators
  if (extra.validators) {
    extra.validators = otherOps.reduce(
      (validators, op) =>
        validators.concat((op.extra && op.extra.validators) || []),
      []
    );
  }

  union.extra = extra;
  return union;
};

export default mergeOperations;
