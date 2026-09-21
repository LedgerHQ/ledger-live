import { ScrollView } from "react-native";
import { Box, Button, Divider, IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { Refresh } from "@ledgerhq/lumen-ui-rnative/symbols";
import type {
  PayCardBaanxWallet,
  PayCardBalanceProps,
  PayCardCombinedWallet,
  PayCardLinkedWallet,
} from "../../types";
import { Section } from "../Section/Section";

export interface BalanceScreenProps extends PayCardBalanceProps {
  readonly onBack: () => void;
}

const HEADER_LX = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "s16",
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

/** Every section says how many it got, so an empty answer reads as empty rather than as missing. */
function Count({ count }: { readonly count: number }) {
  return <Field label="count" value={String(count)} />;
}

function BaanxWallet({ wallet }: { readonly wallet: PayCardBaanxWallet }) {
  return (
    <Box lx={BLOCK_LX}>
      <Divider />
      <Field label="id" value={wallet.id} />
      <Field label="currency" value={wallet.currency} />
      <Field label="balance" value={wallet.balance} />
      <Field label="address" value={wallet.address} />
      <Field label="addressMemo" value={String(wallet.addressMemo)} />
    </Box>
  );
}

function LinkedWallet({ wallet }: { readonly wallet: PayCardLinkedWallet }) {
  return (
    <Box lx={BLOCK_LX}>
      <Divider />
      <Field label="priority" value={String(wallet.priority)} />
      <Field label="id" value={wallet.id} />
      {/* The provider's own ids, unmapped: what a currency mapping would have to be keyed on. */}
      <Field label="currency" value={wallet.currency} />
      <Field label="network" value={wallet.network} />
      <Field label="ledgerId" value={wallet.ledgerId ?? "undefined — this pair is not mapped"} />
      <Field label="address" value={wallet.address} />
    </Box>
  );
}

function CombinedWallet({ wallet }: { readonly wallet: PayCardCombinedWallet }) {
  return (
    <Box lx={BLOCK_LX}>
      <Divider />
      <Text typography="body2">{`${wallet.priority}. ${wallet.currency} / ${wallet.network}`}</Text>
      <Field label="id" value={wallet.id} />
      <Field label="ledgerId" value={wallet.ledgerId ?? "undefined — this pair is not mapped"} />
      <Field
        label="balance"
        value={wallet.balance ?? "null — still reading, or no Baanx wallet matched"}
      />
      <Field label="address" value={wallet.address} />
    </Box>
  );
}

export function BalanceScreen({
  baanxWallets,
  linkedWallets,
  combinedWallets,
  isFetching,
  errors,
  onBack,
  refresh,
}: BalanceScreenProps) {
  return (
    <ScrollView>
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

      {errors.map(({ endpoint, detail }) => (
        <Box key={endpoint} lx={{ gap: "s4", paddingHorizontal: "s16" }}>
          <Text typography="body2" lx={{ color: "error" }}>
            {endpoint}
          </Text>
          <Text typography="body3" lx={{ color: "error" }}>
            {detail}
          </Text>
        </Box>
      ))}

      <Section title="Baanx wallets">
        <Count count={baanxWallets.length} />
        {baanxWallets.map(wallet => (
          <BaanxWallet key={wallet.id} wallet={wallet} />
        ))}
      </Section>

      <Section title="Card linked wallets">
        <Count count={linkedWallets.length} />
        {linkedWallets.map(wallet => (
          <LinkedWallet key={wallet.id} wallet={wallet} />
        ))}
      </Section>

      <Section title="Card linked combined wallets">
        <Count count={combinedWallets.length} />
        {combinedWallets.map(wallet => (
          <CombinedWallet key={wallet.id} wallet={wallet} />
        ))}
      </Section>
    </ScrollView>
  );
}
