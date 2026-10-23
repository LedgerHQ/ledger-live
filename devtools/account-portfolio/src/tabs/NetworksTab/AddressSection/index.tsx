import { TextInput } from "@ledgerhq/lumen-ui-react";
import { ActionButton, type RunProps } from "../../../components/ActionButton";
import { Section } from "../../../components/Section";
import type { AccountPortfolioViewModel } from "../../../AccountPortfolio/types";

export function AddressSection(
  props: Readonly<
    RunProps &
      Pick<AccountPortfolioViewModel, "network" | "address" | "setAddress" | "canQueryAddress">
  >,
) {
  return (
    <Section
      title="An address"
      description={`Check that an address is valid on ${props.network.trim() || "the network"}, or read its next sequence number (the nonce to sign with).`}
    >
      <TextInput
        label="Address"
        value={props.address}
        onChange={e => props.setAddress(e.target.value)}
      />
      <div className="flex flex-wrap gap-12">
        <ActionButton kind="validateAddress" disabled={!props.canQueryAddress} {...props} />
        <ActionButton kind="getNextSequence" disabled={!props.canQueryAddress} {...props} />
      </div>
    </Section>
  );
}
