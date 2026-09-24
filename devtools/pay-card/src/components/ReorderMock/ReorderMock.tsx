import type { PayCardReorderMockProps } from "../../types";
import { Section } from "../Section/Section";
import { ToggleRow } from "../ToggleRow/ToggleRow";

export function ReorderMock({ enabled, setEnabled }: Readonly<PayCardReorderMockProps>) {
  return (
    <Section title="MSW">
      <ToggleRow
        label="Allow wallet reorder"
        description="PUT /v1/wallet/internal/card_linked/priority"
        checked={enabled}
        onChange={setEnabled}
      />
    </Section>
  );
}
