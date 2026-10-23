import { TextInput } from "@ledgerhq/lumen-ui-react";
import { ActionButton, type RunProps } from "../../../components/ActionButton";
import { Section } from "../../../components/Section";
import type { AccountPortfolioViewModel } from "../../../AccountPortfolio/types";

export function IntentSection(
  props: Readonly<
    RunProps &
      Pick<
        AccountPortfolioViewModel,
        | "intentJson"
        | "setIntentJson"
        | "intentValid"
        | "customFees"
        | "setCustomFees"
        | "canEstimate"
        | "canEncode"
      >
  >,
) {
  return (
    <Section
      title="Transaction intent"
      description="Describe what to send. Estimate gives the fee; Encode gives the raw transaction to sign. Neither sends anything."
    >
      <TextInput
        multiline
        minLines={6}
        maxLines={14}
        label="Intent (JSON)"
        value={props.intentJson}
        onChange={e => props.setIntentJson(e.target.value)}
        status={props.intentValid ? undefined : "error"}
        helperText={
          props.intentValid
            ? "EVM types: send-legacy, send-eip1559, staking-legacy, staking-eip1559. Other networks have their own."
            : "Not a JSON object"
        }
      />
      <TextInput
        label="Custom fees (optional, Encode only)"
        value={props.customFees}
        onChange={e => props.setCustomFees(e.target.value)}
      />
      <div className="flex flex-wrap gap-12">
        <ActionButton kind="estimateFee" disabled={!props.canEstimate} {...props} />
        <ActionButton kind="encodeTransaction" disabled={!props.canEncode} {...props} />
      </div>
    </Section>
  );
}
