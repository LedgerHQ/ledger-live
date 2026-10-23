import { TextInput } from "@ledgerhq/lumen-ui-react";
import type { AccountPortfolioViewModel } from "../../AccountPortfolio/types";

/** The chain of the Networks and Write tabs: one value, shared by both. */
export function NetworkField({
  network,
  setNetwork,
}: Readonly<Pick<AccountPortfolioViewModel, "network" | "setNetwork">>) {
  return (
    <TextInput
      label="Network"
      helperText="As List networks names it, such as ethereum, bitcoin or base."
      value={network}
      onChange={e => setNetwork(e.target.value)}
    />
  );
}
