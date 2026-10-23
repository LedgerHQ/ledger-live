import { TextInput } from "@ledgerhq/lumen-ui-react";
import { ActionButton, type RunProps } from "../../../components/ActionButton";
import { Section } from "../../../components/Section";
import type { AccountPortfolioViewModel } from "../../../AccountPortfolio/types";

export function CombineSection(
  props: Readonly<
    RunProps &
      Pick<
        AccountPortfolioViewModel,
        | "rawTransaction"
        | "setRawTransaction"
        | "signature"
        | "setSignature"
        | "pubkey"
        | "setPubkey"
        | "canCombine"
      >
  >,
) {
  return (
    <Section
      title="Add the signature"
      description="Join the raw transaction and the signature the device produced into a signed transaction. Nothing is sent."
    >
      <TextInput
        multiline
        minLines={3}
        maxLines={8}
        label="Raw transaction"
        value={props.rawTransaction}
        onChange={e => props.setRawTransaction(e.target.value)}
      />
      <TextInput
        label="Signature"
        value={props.signature}
        onChange={e => props.setSignature(e.target.value)}
      />
      <TextInput
        label="Public key (optional)"
        value={props.pubkey}
        onChange={e => props.setPubkey(e.target.value)}
      />
      <div className="flex gap-12">
        <ActionButton kind="combineTransaction" disabled={!props.canCombine} {...props} />
      </div>
    </Section>
  );
}
