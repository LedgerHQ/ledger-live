import { Banner, Switch, TextInput } from "@ledgerhq/lumen-ui-react";
import { ActionButton, type RunProps } from "../../../components/ActionButton";
import { Section } from "../../../components/Section";
import type { AccountPortfolioViewModel } from "../../../AccountPortfolio/types";

export function BroadcastSection(
  props: Readonly<
    RunProps &
      Pick<
        AccountPortfolioViewModel,
        | "network"
        | "signedTransaction"
        | "setSignedTransaction"
        | "confirmBroadcast"
        | "setConfirmBroadcast"
        | "canBroadcast"
      >
  >,
) {
  return (
    <Section title="Broadcast">
      <Banner
        appearance="warning"
        title="This sends a real transaction"
        description="Once the network has it, it cannot be taken back. Check the network and the signed transaction first."
      />
      <TextInput
        multiline
        minLines={3}
        maxLines={8}
        label="Signed transaction"
        value={props.signedTransaction}
        onChange={e => props.setSignedTransaction(e.target.value)}
      />
      <div className="flex items-center gap-12">
        <Switch
          id="confirm-broadcast"
          size="sm"
          selected={props.confirmBroadcast}
          onChange={props.setConfirmBroadcast}
        />
        <label htmlFor="confirm-broadcast" className="body-2 text-base">
          {`Send it to ${props.network.trim() || "the network"} for real`}
        </label>
      </div>
      <div className="flex gap-12">
        <ActionButton
          kind="broadcastTransaction"
          appearance="red"
          disabled={!props.canBroadcast}
          {...props}
        />
      </div>
    </Section>
  );
}
