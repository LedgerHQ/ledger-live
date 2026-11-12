import type { ReactNode } from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  SearchInput,
  Switch,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import type { ReceiveToolProps } from "../types";
import { copy } from "./copy";
import { useReceiveToolViewModel } from "./useReceiveToolViewModel";

function Section({
  title,
  description,
  action,
  children,
}: Readonly<{ title: string; description: string; action?: ReactNode; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-12 px-16 py-16">
      <div className="flex items-start justify-between gap-12">
        <div className="flex flex-col gap-4">
          <h3 className="body-1-semi-bold text-base">{title}</h3>
          <p className="body-3 text-muted">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SwitchRow({
  label,
  selected,
  onChange,
}: Readonly<{ label: string; selected: boolean; onChange: (selected: boolean) => void }>) {
  return (
    <div className="flex items-center justify-between gap-12">
      <span className="body-2 text-base">{label}</span>
      <Switch aria-label={label} selected={selected} onChange={onChange} />
    </div>
  );
}

export function Receive(props: ReceiveToolProps) {
  const {
    flag,
    verifyHint,
    trigger,
    assets,
    search,
    setSearch,
    excludedDraft,
    setExcludedDraft,
    applyExcludedFamilies,
    deeplink,
    setDeeplink,
    openDeeplink,
  } = useReceiveToolViewModel(props);

  return (
    <div className="flex flex-col">
      <Section title={copy.flagTitle} description={copy.flagDescription}>
        <SwitchRow label={copy.flagEnabled} selected={flag.enabled} onChange={flag.setEnabled} />
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

      <Section title={copy.verifyHintTitle} description={copy.verifyHintDescription}>
        <SwitchRow
          label={copy.verifyHintSeen}
          selected={verifyHint.hasSeen}
          onChange={verifyHint.setHasSeen}
        />
      </Section>

      <Section title={copy.deeplinkTitle} description={copy.deeplinkDescription}>
        <TextInput
          label={copy.deeplinkLabel}
          value={deeplink}
          onChange={event => setDeeplink(event.target.value)}
        />
        <Button className="self-end" appearance="gray" size="sm" onClick={openDeeplink}>
          {copy.openDeeplink}
        </Button>
      </Section>

      <Section
        title={copy.triggerTitle}
        description={copy.triggerDescription}
        action={
          <Button appearance="accent" size="sm" onClick={trigger.onPickAsset}>
            {copy.pickAsset}
          </Button>
        }
      >
        <SearchInput
          value={search}
          onChange={event => setSearch(event.target.value)}
          onClear={() => setSearch("")}
          placeholder={copy.searchPlaceholder}
        />
        {assets.length === 0 ? <p className="body-2 text-muted">{copy.noAsset}</p> : null}
        <div className="-mx-8 flex flex-col">
          {assets.map(asset => (
            <ListItem key={asset.id} onClick={() => trigger.onReceive(asset.id)}>
              <ListItemLeading>
                <CryptoIcon
                  ledgerId={asset.currencyId}
                  ticker={asset.ticker}
                  network={asset.networkId}
                  size={40}
                  shape="circle"
                />
                <ListItemContent>
                  <ListItemTitle>{asset.label}</ListItemTitle>
                  <ListItemDescription>{`${asset.ticker} · ${asset.network}`}</ListItemDescription>
                </ListItemContent>
              </ListItemLeading>
              <ListItemTrailing>
                <ChevronRight size={20} />
              </ListItemTrailing>
            </ListItem>
          ))}
        </div>
      </Section>
    </div>
  );
}
