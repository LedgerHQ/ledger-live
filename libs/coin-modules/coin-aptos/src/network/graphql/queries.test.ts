import type { DocumentNode, FieldNode, OperationDefinitionNode } from "graphql";
import { print } from "graphql";
import { GetAccountTransactionsData, GetAccountTransactionsDataGt } from "./queries";

const orderByOf = (query: DocumentNode): string | undefined => {
  const operation = query.definitions[0] as OperationDefinitionNode;
  const field = operation.selectionSet.selections[0] as FieldNode;
  const orderBy = field.arguments?.find(argument => argument.name.value === "order_by");
  return orderBy && print(orderBy.value);
};

describe("account transactions queries", () => {
  // Offset pagination is only consistent across pages with an explicit, unique ordering.
  it.each([
    ["GetAccountTransactionsData", GetAccountTransactionsData],
    ["GetAccountTransactionsDataGt", GetAccountTransactionsDataGt],
  ])("%s orders by ascending transaction version", (_, query) => {
    expect(orderByOf(query)).toBe("{transaction_version: asc}");
  });
});
