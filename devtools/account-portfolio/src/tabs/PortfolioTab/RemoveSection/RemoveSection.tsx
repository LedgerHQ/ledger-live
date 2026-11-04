import { Button, TextInput } from "@ledgerhq/lumen-ui-react";
import { ActionButton, type RunProps } from "../../../components/ActionButton/ActionButton";
import { Section } from "../../../components/Section/Section";
import type { AccountPortfolioViewModel } from "../../../account-portfolio/viewModelTypes";

export function RemoveSection(
  props: Readonly<
    RunProps &
      Pick<
        AccountPortfolioViewModel,
        | "removeIdsText"
        | "setRemoveIdsText"
        | "removeCount"
        | "canRemove"
        | "canFillRemoveIds"
        | "fillRemoveIds"
      >
  >,
) {
  return (
    <Section
      title="Remove registrations"
      description="Stop tracking some registrations. Get portfolio lists their ids, and the button below fills them in for you."
    >
      <TextInput
        multiline
        minLines={3}
        maxLines={8}
        label="Registration ids (one per line)"
        value={props.removeIdsText}
        onChange={e => props.setRemoveIdsText(e.target.value)}
      />
      <div className="flex flex-wrap gap-12">
        <Button
          size="sm"
          appearance="gray"
          disabled={!props.canFillRemoveIds}
          onClick={props.fillRemoveIds}
        >
          Fill from the last Get portfolio
        </Button>
        <ActionButton
          kind="removeRegistrations"
          appearance="red"
          disabled={!props.canRemove}
          label={`Remove ${props.removeCount} registration${props.removeCount === 1 ? "" : "s"}`}
          {...props}
        />
      </div>
    </Section>
  );
}
