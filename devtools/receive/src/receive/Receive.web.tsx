import type { ReactNode } from "react";
import { Button, Switch, TextInput } from "@ledgerhq/lumen-ui-react";
import type { ReceiveToolProps } from "../types";
import { copy } from "./copy";
import { useReceiveToolViewModel } from "./useReceiveToolViewModel";

function Section({
  title,
  description,
  children,
}: Readonly<{ title: string; description: string; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-12 px-16 py-16">
      <div className="flex flex-col gap-4">
        <h3 className="body-1-semi-bold text-base">{title}</h3>
        <p className="body-3 text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function Receive(props: ReceiveToolProps) {
  const { flag, excludedDraft, setExcludedDraft, applyExcludedFamilies } =
    useReceiveToolViewModel(props);

  return (
    <div className="flex flex-col">
      <Section title={copy.flagTitle} description={copy.flagDescription}>
        <div className="flex items-center justify-between gap-12">
          <span className="body-2 text-base">{copy.flagEnabled}</span>
          <Switch
            aria-label={copy.flagEnabled}
            selected={flag.enabled}
            onChange={flag.setEnabled}
          />
        </div>
        <TextInput
          label={copy.excludedFamilies}
          placeholder={copy.excludedFamiliesPlaceholder}
          value={excludedDraft}
          onChange={event => setExcludedDraft(event.target.value)}
        />
        <Button className="self-end" appearance="gray" size="sm" onClick={applyExcludedFamilies}>
          {copy.apply}
        </Button>
      </Section>
    </div>
  );
}
