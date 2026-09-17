import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import {
  Button,
  Checkbox,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemTitle,
  ListItemTrailing,
  SearchInput,
  SegmentedControl,
  SegmentedControlButton,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import {
  ACCOUNTS_PER_CURRENCY_PICKS,
  type ByCurrencySectionViewModel,
} from "../hooks/useByCurrencySectionViewModel";

interface Props {
  vm: ByCurrencySectionViewModel;
}

export function ByCurrencyTab({ vm }: Props) {
  return (
    <div className="flex flex-col gap-12 pt-4">
      <SearchInput
        value={vm.currencySearch}
        onChange={e => vm.setCurrencySearch(e.target.value)}
        placeholder="Search currencies…"
      />

      <div className="flex items-center justify-between">
        <span className="body-4 text-muted">
          {vm.filteredCurrencies.length} currencies
          {vm.selectedCount > 0 ? ` · ${vm.selectedCount} selected` : ""}
        </span>
        <div className="flex gap-8">
          <button
            onClick={vm.selectAll}
            className="body-4 text-primary cursor-pointer bg-transparent border-none p-0"
          >
            Select all
          </button>
          {vm.selectedCount > 0 && (
            <button
              onClick={vm.clearSelection}
              className="body-4 text-muted cursor-pointer bg-transparent border-none p-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto h-[200px] rounded-8">
        {vm.filteredCurrencies.length === 0 ? (
          <p className="body-4 text-muted p-12">No currencies match.</p>
        ) : (
          vm.filteredCurrencies.map(c => {
            const checked = vm.selectedIds.has(c.id);
            return (
              <ListItem
                key={c.id}
                active={checked}
                density="compact"
                onClick={() => vm.toggleCurrency(c.id)}
              >
                <ListItemContent>
                  <div className="flex items-center gap-10">
                    <CryptoIcon ledgerId={c.id} ticker={c.ticker} size={24} />
                    <div className="flex flex-col min-w-0">
                      <ListItemTitle>{c.name}</ListItemTitle>
                      <ListItemDescription>{c.ticker}</ListItemDescription>
                    </div>
                  </div>
                </ListItemContent>
                <ListItemTrailing>
                  <Checkbox checked={checked} onCheckedChange={() => vm.toggleCurrency(c.id)} />
                </ListItemTrailing>
              </ListItem>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-6">
        <span className="body-4 text-muted">Accounts per currency</span>
        <div className="w-fit">
          <SegmentedControl
            selectedValue={String(vm.accountsPerCurrency)}
            onSelectedChange={v => vm.setAccountsPerCurrency(Number(v))}
            tabLayout="fit"
          >
            {ACCOUNTS_PER_CURRENCY_PICKS.map(n => (
              <SegmentedControlButton key={n} value={n}>
                {n}
              </SegmentedControlButton>
            ))}
          </SegmentedControl>
        </div>
      </div>

      <TextInput
        label="Token IDs — sub-accounts (optional, comma-separated)"
        placeholder="ethereum/erc20/usd__coin, solana/spl/…"
        value={vm.tokenInput}
        onChange={e => vm.setTokenInput(e.target.value)}
      />

      {vm.selectedCount > 0 && (
        <p className="body-4 text-muted">
          {vm.totalAccounts} account{vm.totalAccounts > 1 ? "s" : ""} will be generated
        </p>
      )}

      <div className="flex gap-8">
        <Button
          appearance="gray"
          size="sm"
          disabled={vm.selectedCount === 0}
          onClick={vm.handleByCurrency}
        >
          Generate with history
        </Button>
        <Button
          appearance="gray"
          size="sm"
          disabled={vm.selectedCount === 0}
          onClick={vm.handleGenerateEmpty}
        >
          Generate empty
        </Button>
      </div>
    </div>
  );
}
