import { ScrollView } from "react-native";
import { Box, Button, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import type { PayCardMockTransactionAsset, PayCardTransactionsMockProps } from "../../types";
import { Section } from "../Section/Section";

const ASSETS: readonly PayCardMockTransactionAsset[] = ["usdc", "btc", "eth"];

export interface TransactionsScreenProps extends PayCardTransactionsMockProps {
  readonly onBack: () => void;
}

export function TransactionsScreen({
  available,
  isOverridden,
  count,
  fill,
  empty,
  receive,
  clear,
  onBack,
}: TransactionsScreenProps) {
  return (
    <ScrollView>
      <Box lx={{ padding: "s16", alignItems: "flex-start" }}>
        <Button appearance="gray" size="sm" onPress={onBack}>
          Back
        </Button>
      </Box>

      <Section title="Transaction mock">
        <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
          <Tag
            size="sm"
            appearance={available ? "success" : "warning"}
            label={available ? "MSW enabled" : "MSW disabled"}
          />
          <Tag
            size="sm"
            appearance={isOverridden ? "success" : "gray"}
            label={isOverridden ? `${count} mocked` : "Provider / mock session"}
          />
        </Box>
        <Text typography="body3" lx={{ color: "muted" }}>
          Changes invalidate the Card transaction cache, so an open Pay screen refreshes
          automatically.
        </Text>
        <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
          <Button appearance="gray" size="sm" disabled={!available} onPress={fill}>
            Full fixture
          </Button>
          <Button appearance="gray" size="sm" disabled={!available} onPress={empty}>
            Empty list
          </Button>
          <Button appearance="gray" size="sm" disabled={!available} onPress={clear}>
            Use provider
          </Button>
        </Box>
      </Section>

      <Section title="Receive transaction">
        <Text typography="body3" lx={{ color: "muted" }}>
          Adds one newest charge funded only by that asset. Repeat to build a longer history.
        </Text>
        <Box lx={{ flexDirection: "row", flexWrap: "wrap", gap: "s8" }}>
          {ASSETS.map(asset => (
            <Button
              key={asset}
              appearance="base"
              size="sm"
              disabled={!available}
              onPress={() => receive(asset)}
            >
              Receive {asset.toUpperCase()}
            </Button>
          ))}
        </Box>
      </Section>
    </ScrollView>
  );
}
