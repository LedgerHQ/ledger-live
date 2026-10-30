import { Switch, TextInput } from "@ledgerhq/lumen-ui-react";
import { ActionButton, type RunProps } from "../../components/ActionButton/ActionButton";
import { RangeControl } from "../../components/RangeControl/RangeControl";
import { Section } from "../../components/Section/Section";
import type { AccountPortfolioViewModel } from "../../account-portfolio/viewModelTypes";

export function ReadTab(
  props: Readonly<
    RunProps &
      Pick<
        AccountPortfolioViewModel,
        | "hideUnknown"
        | "setHideUnknown"
        | "accountFilter"
        | "setAccountFilter"
        | "range"
        | "setRange"
      >
  >,
) {
  return (
    <Section
      title="Read the portfolio"
      description="Balance: what each account holds now. History: how it changed over the range. Updates: the operations."
    >
      <div className="flex flex-wrap gap-12">
        <ActionButton kind="getBalance" {...props} />
        <ActionButton kind="getBalanceHistory" {...props} />
        <ActionButton kind="getUpdates" {...props} />
      </div>
      <div className="flex flex-col gap-8">
        <span className="body-3 text-muted">Range of the balance history</span>
        <RangeControl range={props.range} setRange={props.setRange} />
      </div>
      <div className="flex items-center gap-12">
        <Switch
          id="hide-unknown-tokens"
          size="sm"
          selected={props.hideUnknown}
          onChange={props.setHideUnknown}
        />
        <label htmlFor="hide-unknown-tokens" className="body-2 text-base">
          Hide tokens without a ledger id
        </label>
      </div>
      <TextInput
        label="Only one account (optional)"
        helperText="The account id the service gives back in Get portfolio. Empty reads every account."
        value={props.accountFilter}
        onChange={e => props.setAccountFilter(e.target.value)}
      />
    </Section>
  );
}
