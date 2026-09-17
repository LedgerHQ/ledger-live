import { useState } from "react";
import { Box, Button, Divider, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import type { PayCardAssetsFixtureProps } from "../../types";
import { Section } from "../Section/Section";
import { assetSelectItems, pairFromCatalogKey } from "./catalogOptions";

const ROW = { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" } as const;

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

  return (
    <Section title="Assets fixtures">
      {isMockingEnabled ? (
        <Box lx={{ gap: "s8" }}>
          <Text typography="body3" lx={{ color: "muted" }}>
            Pins the wallet endpoints. Currency is the Baanx catalog only.
          </Text>
          <Text typography="body3">{`Preset: ${preset}`}</Text>
          <Box style={ROW}>
            <Button appearance="gray" size="sm" onPress={applyEmpty}>
              Empty
            </Button>
            <Button appearance="gray" size="sm" onPress={applyLoaded}>
              Loaded
            </Button>
            <Button appearance="gray" size="sm" onPress={clear} disabled={preset === "none"}>
              Use provider
            </Button>
          </Box>
          <Divider />
          <Text typography="body3">Currency</Text>
          <Box style={ROW}>
            {items.map(item => (
              <Button
                key={item.value}
                appearance={item.value === selectedKey ? "accent" : "gray"}
                size="sm"
                onPress={() => setSelectedKey(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          <TextInput
            label="Balance"
            value={balance}
            onChangeText={setBalance}
            placeholder="125.40"
            editable={!unknownBalance}
          />
          <Button
            appearance="gray"
            size="sm"
            onPress={() => setUnknownBalance(current => !current)}
          >
            {unknownBalance ? "Unknown balance on" : "Unknown balance off"}
          </Button>
          <Button
            appearance="accent"
            size="sm"
            disabled={!canAdd}
            onPress={() => {
              const pair = pairFromCatalogKey(selectedKey);
              if (pair === null) {
                return;
              }

              addAsset({
                currency: pair.currency,
                network: pair.network,
                balance,
                unknownBalance,
              });
            }}
          >
            Add asset
          </Button>
          {wallets.map(wallet => (
            <Box key={wallet.id} style={{ ...ROW, justifyContent: "space-between" }}>
              <Text typography="body3">
                {wallet.currency}/{wallet.network}
                {wallet.balance === null ? " · no amount" : ` · ${wallet.balance}`}
              </Text>
              <Button appearance="gray" size="sm" onPress={() => removeAsset(wallet.id)}>
                Remove
              </Button>
            </Box>
          ))}
        </Box>
      ) : (
        <Text typography="body3" lx={{ color: "muted" }}>
          Enable MSW to pin Assets.
        </Text>
      )}
    </Section>
  );
}
