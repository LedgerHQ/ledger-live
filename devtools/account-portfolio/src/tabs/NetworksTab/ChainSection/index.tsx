import { TextInput } from "@ledgerhq/lumen-ui-react";
import { ActionButton, type RunProps } from "../../../components/ActionButton";
import { NetworkField } from "../../../components/NetworkField";
import { Section } from "../../../components/Section";
import type { AccountPortfolioViewModel } from "../../../AccountPortfolio/types";

export function ChainSection(
  props: Readonly<
    RunProps &
      Pick<
        AccountPortfolioViewModel,
        "network" | "setNetwork" | "cursor" | "setCursor" | "canQueryNetwork"
      >
  >,
) {
  return (
    <Section
      title="A network"
      description="Its latest block, and the validators that can be staked to."
    >
      <NetworkField network={props.network} setNetwork={props.setNetwork} />
      <TextInput
        label="Validators cursor (optional)"
        helperText="The next value of the previous page, to read the page after it."
        value={props.cursor}
        onChange={e => props.setCursor(e.target.value)}
      />
      <div className="flex flex-wrap gap-12">
        <ActionButton kind="getLastBlock" disabled={!props.canQueryNetwork} {...props} />
        <ActionButton kind="getValidators" disabled={!props.canQueryNetwork} {...props} />
      </div>
    </Section>
  );
}
