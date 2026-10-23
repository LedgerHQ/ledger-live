import { TextInput } from "@ledgerhq/lumen-ui-react";
import { ActionButton, type RunProps } from "../../../components/ActionButton";
import { Section } from "../../../components/Section";
import type { AccountPortfolioViewModel } from "../../../AccountPortfolio/types";

export function AddAddressesSection(
  props: Readonly<
    RunProps &
      Pick<
        AccountPortfolioViewModel,
        | "addAccountId"
        | "setAddAccountId"
        | "addAddressesText"
        | "setAddAddressesText"
        | "addAddressesCount"
        | "canAddAddresses"
      >
  >,
) {
  return (
    <Section
      title="Add addresses to an account"
      description="Give an account more addresses to watch. Use the account id Get portfolio lists."
    >
      <TextInput
        label="Account id"
        helperText="As Get portfolio lists it, such as base:0x…"
        value={props.addAccountId}
        onChange={e => props.setAddAccountId(e.target.value)}
      />
      <TextInput
        multiline
        minLines={3}
        maxLines={8}
        label="Addresses (one per line)"
        value={props.addAddressesText}
        onChange={e => props.setAddAddressesText(e.target.value)}
      />
      <div className="flex gap-12">
        <ActionButton
          kind="addAddresses"
          appearance="base"
          disabled={!props.canAddAddresses}
          label={`Add ${props.addAddressesCount} address${props.addAddressesCount === 1 ? "" : "es"}`}
          {...props}
        />
      </div>
    </Section>
  );
}
