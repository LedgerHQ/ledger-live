import { ScrollView } from "react-native";
import { Box, Button, Divider, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { Refresh } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { PayCardBalanceProps, PayCardBalanceWallet } from "../../types";

export interface BalanceScreenProps extends PayCardBalanceProps {
  readonly onBack: () => void;
}

const CONTAINER_LX = { gap: "s16", padding: "s16" } as const;
const HEADER_LX = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
} as const;
const BLOCK_LX = { gap: "s4" } as const;
const FIELD_LX = { flexDirection: "row", gap: "s8" } as const;

function Field({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Box lx={FIELD_LX}>
      <Text typography="body3" lx={{ color: "muted" }}>
        {label}
      </Text>
      <Text typography="body3" lx={{ color: "base" }}>
        {value}
      </Text>
    </Box>
  );
}

function Wallet({
  wallet,
  isPricingWired,
}: {
  readonly wallet: PayCardBalanceWallet;
  readonly isPricingWired: boolean;
}) {
  return (
    <Box lx={BLOCK_LX}>
      <Text typography="body2">{`${wallet.priority}. ${wallet.currency} / ${wallet.network}`}</Text>
      {/* The provider's own ids, unmapped: what a currency mapping would have to be keyed on. */}
      <Field label="currency" value={wallet.currency} />
      <Field label="network" value={wallet.network} />
      <Field
        label="balance"
        value={wallet.balance ?? "null — still reading, or no internal wallet matched"}
      />
      <Field
        label="counterValue"
        value={
          wallet.counterValue === null
            ? isPricingWired
              ? "null — no balance yet, no currency matched this ticker, or no rate for it"
              : "null — this host wired no pricing"
            : String(wallet.counterValue)
        }
      />
      <Field label="id" value={wallet.id} />
      <Field label="address" value={wallet.address} />
    </Box>
  );
}

export function BalanceScreen({
  total,
  isPartialTotal,
  isPricingWired,
  wallets,
  isFetching,
  errors,
  onBack,
  refresh,
}: BalanceScreenProps) {
  return (
    <ScrollView>
      <Box lx={CONTAINER_LX}>
        <Box lx={HEADER_LX}>
          <Button appearance="gray" size="sm" onPress={onBack}>
            Back
          </Button>
          <IconButton
            icon={Refresh}
            appearance="no-background"
            size="sm"
            loading={isFetching}
            onPress={refresh}
            accessibilityLabel="Refresh"
          />
        </Box>

        <Box lx={BLOCK_LX}>
          <Text typography="body3" lx={{ color: "muted" }}>
            Total amount
          </Text>
          {/* Always stringified: an absent total has to read as `undefined`, not as a blank. */}
          <Text typography="heading4SemiBold" lx={{ color: "base" }}>
            {String(total)}
          </Text>
          <Field label="isPartialTotal" value={String(isPartialTotal)} />
          {!isPricingWired && <Field label="pricing" value="not wired by this host" />}
          <Field label="wallets" value={String(wallets.length)} />
        </Box>

        {errors.map(({ endpoint, detail }) => (
          <Box key={endpoint} lx={BLOCK_LX}>
            <Text typography="body2" lx={{ color: "error" }}>
              {endpoint}
            </Text>
            <Text typography="body3" lx={{ color: "error" }}>
              {detail}
            </Text>
          </Box>
        ))}

        {wallets.map(wallet => (
          <Box key={wallet.id} lx={BLOCK_LX}>
            <Divider />
            <Wallet wallet={wallet} isPricingWired={isPricingWired} />
          </Box>
        ))}
      </Box>
    </ScrollView>
  );
}
