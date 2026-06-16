import React, { ReactNode } from "react";
import { TFunction } from "i18next";
import { TableRoot, Table, TableBody } from "@ledgerhq/lumen-ui-react";
import { render } from "tests/testSetup";

/** Identity translation function for component tests (returns the key as-is). */
export const mockT = ((key: string) => key) as unknown as TFunction;

/**
 * Lumen TableRow / TableHeaderRow must live inside a Table. This renders a
 * component under test in the same hierarchy MarketTableView uses, optionally
 * wrapping it in a TableBody for row-level components.
 */
export function renderInTable(ui: ReactNode, { withBody = false }: { withBody?: boolean } = {}) {
  return render(
    <TableRoot>
      <Table>{withBody ? <TableBody>{ui}</TableBody> : ui}</Table>
    </TableRoot>,
  );
}
