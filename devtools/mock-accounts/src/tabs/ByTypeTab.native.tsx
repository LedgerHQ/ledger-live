import {
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemTitle,
  ListItemTrailing,
  SegmentedControl,
  SegmentedControlButton,
  Switch,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { ByTypeSectionViewModel } from "../hooks/useByTypeSectionViewModel";

interface Props {
  vm: ByTypeSectionViewModel;
  stocksLoading: boolean;
  stablecoinsLoading: boolean;
}

const TYPE_ROWS = [
  { key: "cryptos", label: "Cryptos", desc: "Mainnet accounts (random currencies)" },
  {
    key: "stablecoins",
    label: "Stablecoins",
    desc: "1 account per network with stablecoin sub-accounts",
  },
  { key: "stocks", label: "Stocks", desc: "Tokenized stocks as sub-accounts" },
  { key: "testnets", label: "Testnets", desc: "Include testnet currencies in the pool" },
] as const;

export function ByTypeTab({ vm, stocksLoading, stablecoinsLoading }: Props) {
  const switchValues: Record<string, boolean> = {
    cryptos: vm.includeCryptos,
    stablecoins: vm.includeStablecoins,
    stocks: vm.includeStocks,
    testnets: vm.includeTestnet,
  };
  const switchHandlers: Record<string, (v: boolean) => void> = {
    cryptos: vm.onToggleCryptos,
    stablecoins: vm.setIncludeStablecoins,
    stocks: vm.setIncludeStocks,
    testnets: vm.onToggleTestnet,
  };

  return (
    <Box lx={{ gap: "s12" }}>
      <Box>
        {TYPE_ROWS.map(({ key, label, desc }) => (
          <ListItem key={key}>
            <ListItemContent>
              <ListItemTitle>{label}</ListItemTitle>
              <ListItemDescription>{desc}</ListItemDescription>
            </ListItemContent>
            <ListItemTrailing>
              <Switch checked={switchValues[key]} onCheckedChange={switchHandlers[key]} />
            </ListItemTrailing>
          </ListItem>
        ))}
      </Box>

      <Box lx={{ gap: "s6" }}>
        <Text typography="body4" lx={{ color: "muted" }}>
          Count
        </Text>
        <SegmentedControl
          selectedValue={vm.countInput}
          onSelectedChange={vm.setCountInput}
          tabLayout="fit"
        >
          {(["1", "5", "10", "50"] as const).map(n => (
            <SegmentedControlButton key={n} value={n}>
              {n}
            </SegmentedControlButton>
          ))}
        </SegmentedControl>
      </Box>

      {!vm.isValid ? (
        <Text typography="body3" lx={{ color: "error" }}>
          Select at least one account type.
        </Text>
      ) : null}
      {vm.includeStablecoins && stablecoinsLoading ? (
        <Text typography="body3" lx={{ color: "muted" }}>
          Loading stablecoin data…
        </Text>
      ) : null}
      {vm.includeStocks && stocksLoading ? (
        <Text typography="body3" lx={{ color: "muted" }}>
          Loading stock data…
        </Text>
      ) : null}

      <Button appearance="gray" size="sm" disabled={!vm.isReady} onPress={vm.onGenerate}>
        Generate by type
      </Button>
    </Box>
  );
}
