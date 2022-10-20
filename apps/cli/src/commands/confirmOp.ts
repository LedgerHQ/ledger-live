import { switchMap } from "rxjs/operators";
import {
  formatOperation,
  toOperationRaw,
} from "@ledgerhq/live-common/account/index";
import {
  decodeOperationId,
  findOperationInAccount,
} from "@ledgerhq/live-common/operation";
import { scan } from "../scan";

export default {
  description:
    "Quickly verify if an operation id exists with our explorers (by synchronising the parent account)",
  args: [
    {
      name: "id",
      type: String,
      desc: "operation id to search",
    },
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: "json | text",
      desc: "how to display the data",
    },
  ],
  job: ({ id, format }: { id?: string; format?: "json" | "text" }) => {
    if (!id) throw new Error("--id is required");
    const { accountId } = decodeOperationId(id);
    return scan({
      id: [accountId],
    }).pipe(
      switchMap(async (account) => {
        const op = findOperationInAccount(account, id);
        if (!op)
          throw new Error("operation was not found in account " + account.id);
        return format === "text"
          ? formatOperation(account)(op)
          : toOperationRaw(op);
      })
    );
  },
};
