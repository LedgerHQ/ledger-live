import type { ComponentProps } from "react";
import { Tag } from "@ledgerhq/lumen-ui-react";
import type { PortfolioAccountStatus, PortfolioBalanceStatus } from "../../types";

type Appearance = ComponentProps<typeof Tag>["appearance"];
type Entry = { readonly appearance: Appearance; readonly label: string };

// `Record` over the status union: a status the service adds fails the typecheck here.
const ACCOUNT_STATUS: Record<PortfolioAccountStatus, Entry> = {
  synchronized: { appearance: "success", label: "Synchronized" },
  uninitialized: { appearance: "warning", label: "Uninitialized" },
  not_registered: { appearance: "gray", label: "Not registered" },
  registration_failure: { appearance: "error", label: "Registration failure" },
};

const BALANCE_STATUS: Record<PortfolioBalanceStatus, Entry> = {
  confirmed: { appearance: "success", label: "Confirmed" },
  pending: { appearance: "warning", label: "Pending" },
};

export function AccountStatusTag({ status }: Readonly<{ status: PortfolioAccountStatus }>) {
  const { appearance, label } = ACCOUNT_STATUS[status];
  return <Tag appearance={appearance} size="sm" label={label} />;
}

export function BalanceStatusTag({ status }: Readonly<{ status: PortfolioBalanceStatus }>) {
  const { appearance, label } = BALANCE_STATUS[status];
  return <Tag appearance={appearance} size="sm" label={label} />;
}
