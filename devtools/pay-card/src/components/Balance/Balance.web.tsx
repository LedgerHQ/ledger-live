import { Button, Divider, IconButton } from "@ledgerhq/lumen-ui-react";
import { Refresh } from "@ledgerhq/lumen-ui-react/symbols";
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

function Field({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex gap-8 body-3">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-base break-all">{value}</span>
    </div>
  );
}

/** Every section says how many it got, so an empty answer reads as empty rather than as missing. */
function Count({ count }: { readonly count: number }) {
  return <Field label="count" value={String(count)} />;
}

function BaanxWallet({ wallet }: { readonly wallet: PayCardBaanxWallet }) {
  return (
    <div className="flex flex-col gap-4">
      <Divider />
      <Field label="id" value={wallet.id} />
      <Field label="currency" value={wallet.currency} />
      <Field label="balance" value={wallet.balance} />
      <Field label="address" value={wallet.address} />
      <Field label="addressMemo" value={String(wallet.addressMemo)} />
    </div>
  );
}

function LinkedWallet({ wallet }: { readonly wallet: PayCardLinkedWallet }) {
  return (
    <div className="flex flex-col gap-4">
      <Divider />
      <Field label="priority" value={String(wallet.priority)} />
      <Field label="id" value={wallet.id} />
      {/* The provider's own ids, unmapped: what a currency mapping would have to be keyed on. */}
      <Field label="currency" value={wallet.currency} />
      <Field label="network" value={wallet.network} />
      <Field label="ledgerId" value={wallet.ledgerId ?? "undefined — this pair is not mapped"} />
      <Field label="address" value={wallet.address} />
    </div>
  );
}

function CombinedWallet({ wallet }: { readonly wallet: PayCardCombinedWallet }) {
  return (
    <div className="flex flex-col gap-4">
      <Divider />
      <p className="body-2 text-base">{`${wallet.priority}. ${wallet.currency} / ${wallet.network}`}</p>
      <Field label="id" value={wallet.id} />
      <Field label="ledgerId" value={wallet.ledgerId ?? "undefined — this pair is not mapped"} />
      <Field
        label="balance"
        value={wallet.balance ?? "null — still reading, or no Baanx wallet matched"}
      />
      <Field
        label="ledgerCurrencyId"
        value={wallet.ledgerCurrencyId ?? "null — unmapped asset, or CAL has not answered"}
      />
      <Field label="address" value={wallet.address} />
    </div>
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
    <div className="flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between p-16">
        <Button appearance="gray" size="sm" onClick={onBack}>
          Back
        </Button>
        <IconButton
          icon={Refresh}
          appearance="no-background"
          size="sm"
          loading={isFetching}
          onClick={refresh}
          aria-label="Refresh"
        />
      </div>

      {errors.map(({ endpoint, detail }) => (
        <div key={endpoint} className="flex flex-col gap-4 px-16">
          <p className="body-2 text-error">{endpoint}</p>
          <p className="body-3 text-error break-all">{detail}</p>
        </div>
      ))}

      <Section title="Baanx wallets" backgroundColor="activeSubtle">
        <Count count={baanxWallets.length} />
        {baanxWallets.map(wallet => (
          <BaanxWallet key={wallet.id} wallet={wallet} />
        ))}
      </Section>

      <Section title="Card linked wallets" backgroundColor="warning">
        <Count count={linkedWallets.length} />
        {linkedWallets.map(wallet => (
          <LinkedWallet key={wallet.id} wallet={wallet} />
        ))}
      </Section>

      <Section title="Card linked combined wallets" backgroundColor="success">
        <Count count={combinedWallets.length} />
        {combinedWallets.map(wallet => (
          <CombinedWallet key={wallet.id} wallet={wallet} />
        ))}
      </Section>
    </div>
  );
}
