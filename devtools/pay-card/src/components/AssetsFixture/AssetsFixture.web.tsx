import { useState } from "react";
import {
  Button,
  Divider,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
} from "@ledgerhq/lumen-ui-react";
import type { PayCardAssetsFixtureProps } from "../../types";
import { Section } from "../Section/Section";
import { assetSelectItems, pairFromCatalogKey } from "./catalogOptions";

export function AssetsFixture({
  isMockingEnabled,
  preset,
  wallets,
  catalog,
  applyEmpty,
  applyLoaded,
  addAsset,
  removeAsset,
  clear,
}: PayCardAssetsFixtureProps) {
  const items = assetSelectItems(catalog);
  const [selectedKey, setSelectedKey] = useState(items[0]?.value ?? "");
  const [balance, setBalance] = useState("1.00");
  const [unknownBalance, setUnknownBalance] = useState(false);
  const pair = pairFromCatalogKey(selectedKey);
  const alreadyAdded =
    pair !== null &&
    wallets.some(wallet => wallet.currency === pair.currency && wallet.network === pair.network);
  const canAdd = pair !== null && !alreadyAdded;

  const addSelected = (key: string, nextBalance = balance, nextUnknown = unknownBalance) => {
    const selected = pairFromCatalogKey(key);
    if (selected === null) {
      return;
    }

    addAsset({
      currency: selected.currency,
      network: selected.network,
      balance: nextBalance,
      unknownBalance: nextUnknown,
    });
  };

  return (
    <Section title="Assets fixtures" backgroundColor="activeSubtle">
      {isMockingEnabled ? (
        <>
          <p className="body-3 text-muted">
            Pins `GET /v1/wallet/internal` and `card_linked`. Currency is the Baanx catalog only.
          </p>
          <p className="body-3">
            Preset: <span className="body-3-semi-bold">{preset}</span>
          </p>
          <div className="flex flex-wrap gap-8">
            <Button appearance="gray" size="sm" onClick={applyEmpty}>
              Empty
            </Button>
            <Button appearance="gray" size="sm" onClick={applyLoaded}>
              Loaded
            </Button>
            <Button appearance="gray" size="sm" onClick={clear} disabled={preset === "none"}>
              Use provider
            </Button>
          </div>

          <Divider />
          <p className="body-3-semi-bold">Add one asset</p>
          <Select
            items={items}
            value={selectedKey}
            onValueChange={value => {
              if (value) setSelectedKey(value);
            }}
          >
            <SelectTrigger label="Currency" />
            <SelectContent>
              <SelectList
                renderItem={item => (
                  <SelectItem key={item.value} value={item.value}>
                    <SelectItemText>{item.label}</SelectItemText>
                  </SelectItem>
                )}
              />
            </SelectContent>
          </Select>
          <label className="body-3 flex flex-col gap-4">
            Balance
            <input
              className="body-3 rounded-4 border border-default bg-base px-8 py-4"
              value={balance}
              disabled={unknownBalance}
              onChange={event => setBalance(event.target.value)}
              placeholder="125.40"
            />
          </label>
          <label className="body-3 flex items-center gap-8">
            <input
              type="checkbox"
              checked={unknownBalance}
              onChange={event => setUnknownBalance(event.target.checked)}
            />
            Unknown balance (ticker only)
          </label>
          <Button
            appearance="accent"
            size="sm"
            disabled={!canAdd}
            onClick={() => addSelected(selectedKey)}
          >
            Add asset
          </Button>

          {wallets.length > 0 ? (
            <>
              <Divider />
              {wallets.map(wallet => (
                <div key={wallet.id} className="flex items-center justify-between gap-8">
                  <span className="body-3">
                    {wallet.currency}/{wallet.network}
                    {wallet.balance === null ? " · no amount" : ` · ${wallet.balance}`}
                  </span>
                  <Button appearance="gray" size="sm" onClick={() => removeAsset(wallet.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </>
          ) : null}
        </>
      ) : (
        <p className="body-3 text-muted">Start with `pnpm desktop start:msw` to pin Assets.</p>
      )}
    </Section>
  );
}
