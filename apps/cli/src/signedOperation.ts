import type { Observable } from "rxjs";
import { map } from "rxjs/operators";
import invariant from "invariant";
import type { SignedOperation, Account } from "@ledgerhq/live-common/lib/types";
import { fromSignedOperationRaw } from "@ledgerhq/live-common/lib/transaction";
import { jsonFromFile } from "./stream";
export type InferSignedOperationsOpts = Partial<{
  "signed-operation": string;
}>;
export const inferSignedOperationsOpts = [
  {
    name: "signed-operation",
    alias: "t",
    type: String,
    desc: "JSON file of a signed operation (- for stdin)",
  },
];
export function inferSignedOperations(
  mainAccount: Account,
  opts: InferSignedOperationsOpts
): Observable<SignedOperation> {
  const file = opts["signed-operation"];
  invariant(file, "--signed-operation file is required");
  return jsonFromFile(file as string).pipe(
    map((json) => {
      invariant(typeof json === "object", "not an object JSON");
      invariant(typeof json.signature === "string", "missing signature");
      invariant(typeof json.operation === "object", "missing operation object");
      invariant(
        json.operation.accountId === mainAccount.id,
        "the operation does not match the specified account"
      );
      return fromSignedOperationRaw(json, mainAccount.id);
    })
  );
}
