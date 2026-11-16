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
import type { ReceiveToolAsset, ReceiveToolProps } from "../types";
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

function AssetRow({
  asset,
  onReceive,
}: Readonly<{ asset: ReceiveToolAsset; onReceive: (assetId: string) => void }>) {
  return (
    <ListItem onClick={() => onReceive(asset.id)}>
      <ListItemLeading>
        <CryptoIcon
          ledgerId={asset.currencyId}
          ticker={asset.ticker}
          network={asset.networkId}
          size={32}
        />
        <ListItemContent>
          <ListItemTitle>{asset.label}</ListItemTitle>
          <ListItemDescription>{asset.network}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}

export function Receive(props: ReceiveToolProps) {
  const {
    flag,
    trigger,
    excludedDraft,
    setExcludedDraft,
    applyExcludedFamilies,
    deeplinkDraft,
    setDeeplinkDraft,
    openDeeplink,
  } = useReceiveToolViewModel(props);

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
      <Section title={copy.triggerTitle} description={copy.triggerDescription}>
        <Button className="self-start" appearance="gray" size="sm" onClick={trigger.onPickAsset}>
          {copy.pickAsset}
        </Button>
        {trigger.assets.length === 0 ? (
          <p className="body-3 text-muted">{copy.noAsset}</p>
        ) : (
          <div className="flex flex-col">
            {trigger.assets.map(asset => (
              <AssetRow key={asset.id} asset={asset} onReceive={trigger.onReceive} />
            ))}
          </div>
        )}
      </Section>
      <Section title={copy.deeplinkTitle} description={copy.deeplinkDescription}>
        <TextInput
          label={copy.deeplinkLabel}
          value={deeplinkDraft}
          onChange={event => setDeeplinkDraft(event.target.value)}
        />
        <Button className="self-end" appearance="gray" size="sm" onClick={openDeeplink}>
          {copy.openDeeplink}
        </Button>
      </Section>
    </div>
  );
}
