import { ActionButton, type RunProps } from "../../../components/ActionButton";
import { Section } from "../../../components/Section";

export function NetworkListSection(props: Readonly<RunProps>) {
  return (
    <Section
      title="Supported networks"
      description="The chains the service can read and write. Use these names in the fields below."
    >
      <div className="flex gap-12">
        <ActionButton kind="listNetworks" {...props} />
      </div>
    </Section>
  );
}
