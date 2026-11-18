import type { ReactNode } from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  Switch,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import type { ReceiveToolProps } from "../types";
import { copy } from "./copy";
import { type ReceiveRow, useReceiveToolViewModel } from "./useReceiveToolViewModel";

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

function AssetRow({ row }: Readonly<{ row: ReceiveRow }>) {
  return (
    <ListItem onClick={row.onPress} aria-label={row.accessibilityLabel}>
      <ListItemLeading>
        <CryptoIcon {...row.icon} size={32} />
        <ListItemContent>
          <ListItemTitle>{row.title}</ListItemTitle>
          <ListItemDescription>{row.description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}

export function Receive(props: ReceiveToolProps) {
  const { flag, excluded, deeplink, rows, pickAsset } = useReceiveToolViewModel(props);

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
          value={excluded.draft}
          onChange={event => excluded.setDraft(event.target.value)}
        />
        <Button className="self-end" appearance="gray" size="sm" onClick={excluded.apply}>
          {copy.apply}
        </Button>
      </Section>
      <Section title={copy.triggerTitle} description={copy.triggerDescription}>
        <Button className="self-start" appearance="gray" size="sm" onClick={pickAsset}>
          {copy.pickAsset}
        </Button>
        {rows.length === 0 ? (
          <p className="body-3 text-muted">{copy.noAsset}</p>
        ) : (
          <div className="flex flex-col">
            {rows.map(row => (
              <AssetRow key={row.key} row={row} />
            ))}
          </div>
        )}
      </Section>
      <Section title={copy.deeplinkTitle} description={copy.deeplinkDescription}>
        <TextInput
          label={copy.deeplinkLabel}
          value={deeplink.draft}
          onChange={event => deeplink.setDraft(event.target.value)}
          helperText={deeplink.error}
          status={deeplink.error && "error"}
        />
        <Button
          className="self-end"
          appearance="gray"
          size="sm"
          disabled={!deeplink.canOpen}
          onClick={deeplink.open}
        >
          {copy.openDeeplink}
        </Button>
      </Section>
    </div>
  );
}
