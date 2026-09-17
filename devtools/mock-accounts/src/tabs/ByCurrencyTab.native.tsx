import { ScrollView, View } from "react-native";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  Box,
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
  Text,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import {
  ACCOUNTS_PER_CURRENCY_PICKS,
  type ByCurrencySectionViewModel,
} from "../hooks/useByCurrencySectionViewModel";

interface Props {
  vm: ByCurrencySectionViewModel;
}

export function ByCurrencyTab({ vm }: Props) {
  return (
    <Box lx={{ gap: "s12" }}>
      <SearchInput
        value={vm.currencySearch}
        onChangeText={vm.setCurrencySearch}
        placeholder="Search currencies…"
      />

      <Box style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text typography="body4" lx={{ color: "muted" }}>
          {vm.filteredCurrencies.length} currencies
          {vm.selectedCount > 0 ? ` · ${vm.selectedCount} selected` : ""}
        </Text>
        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button appearance="transparent" size="sm" onPress={vm.selectAll}>
            Select all
          </Button>
          {vm.selectedCount > 0 ? (
            <Button appearance="transparent" size="sm" onPress={vm.clearSelection}>
              Clear
            </Button>
          ) : null}
        </Box>
      </Box>

      <View style={{ height: 200, borderRadius: 8, overflow: "hidden" }}>
        <ScrollView nestedScrollEnabled>
          {vm.filteredCurrencies.length === 0 ? (
            <Box lx={{ padding: "s12" }}>
              <Text typography="body4" lx={{ color: "muted" }}>
                No currencies match.
              </Text>
            </Box>
          ) : (
            vm.filteredCurrencies.map(c => {
              const checked = vm.selectedIds.has(c.id);
              return (
                <ListItem
                  key={c.id}
                  active={checked}
                  density="compact"
                  onPress={() => vm.toggleCurrency(c.id)}
                >
                  <ListItemContent>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <CryptoIcon ledgerId={c.id} ticker={c.ticker} size={24} />
                      <View>
                        <ListItemTitle>{c.name}</ListItemTitle>
                        <ListItemDescription>{c.ticker}</ListItemDescription>
                      </View>
                    </View>
                  </ListItemContent>
                  <ListItemTrailing>
                    <Checkbox checked={checked} onCheckedChange={() => vm.toggleCurrency(c.id)} />
                  </ListItemTrailing>
                </ListItem>
              );
            })
          )}
        </ScrollView>
      </View>

      <Box lx={{ gap: "s6" }}>
        <Text typography="body4" lx={{ color: "muted" }}>
          Accounts per currency
        </Text>
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
      </Box>

      <TextInput
        label="Token IDs — sub-accounts (optional, comma-separated)"
        placeholder="ethereum/erc20/usd__coin, …"
        value={vm.tokenInput}
        onChangeText={vm.setTokenInput}
      />

      {vm.selectedCount > 0 ? (
        <Text typography="body4" lx={{ color: "muted" }}>
          {vm.totalAccounts} account{vm.totalAccounts > 1 ? "s" : ""} will be generated
        </Text>
      ) : null}

      <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          appearance="gray"
          size="sm"
          disabled={vm.selectedCount === 0}
          onPress={vm.handleByCurrency}
        >
          Generate with history
        </Button>
        <Button
          appearance="gray"
          size="sm"
          disabled={vm.selectedCount === 0}
          onPress={vm.handleGenerateEmpty}
        >
          Generate empty
        </Button>
      </Box>
    </Box>
  );
}
