import { IconButton } from "@ledgerhq/lumen-ui-react";
import { Trash } from "@ledgerhq/lumen-ui-react/symbols";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { PnlAmountField } from "../../../shared/components/PnlAmountField";
import { PnlTraderAssetPicker } from "./PnlTraderAssetPicker";
import { PnlTraderOperationsEditor } from "./PnlTraderOperationsEditor";
import type { TraderAssetId, TraderOpInput } from "../model/types";
import type { TraderMultiAccountVM } from "../useTraderViewModel";

type PnlTraderAccountSectionProps = Readonly<{
  account: TraderMultiAccountVM;
  index: number;
  fiatCode: string;
  canRemove: boolean;
  onAssetChange: (id: TraderAssetId) => void;
  onCurrentPriceChange: (value: string) => void;
  onAddRow: (values: TraderOpInput) => void;
  onSetRow: (rowId: string, values: TraderOpInput) => void;
  onRemoveRow: (rowId: string) => void;
  onRemove: () => void;
}>;

export function PnlTraderAccountSection({
  account,
  index,
  fiatCode,
  canRemove,
  onAssetChange,
  onCurrentPriceChange,
  onAddRow,
  onSetRow,
  onRemoveRow,
  onRemove,
}: PnlTraderAccountSectionProps) {
  const priceFieldId = `trader-multi-${account.id}-price`;

  return (
    <section className="border-muted flex flex-col gap-16 rounded-md border p-16">
      <header className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-8 min-w-0">
          <CryptoIcon
            ledgerId={account.asset.currency.id}
            ticker={account.asset.ticker}
            size={20}
          />
          <span className="body-2 truncate">
            Account {index + 1} · {account.asset.ticker}
          </span>
        </div>
        {canRemove ? (
          <IconButton
            appearance="no-background"
            size="sm"
            icon={Trash}
            onClick={onRemove}
            aria-label={`Remove account ${index + 1}`}
          />
        ) : null}
      </header>

      <PnlTraderAssetPicker
        selectedAssetId={account.assetId}
        onSelectedAssetIdChange={onAssetChange}
      />

      <PnlAmountField
        id={priceFieldId}
        label="Current price"
        value={account.currentPriceUsd}
        currencySymbol="$"
        onChange={onCurrentPriceChange}
      />

      <PnlTraderOperationsEditor
        rows={account.rows}
        assetTicker={account.asset.ticker}
        fiatCode={fiatCode}
        fiatSymbol="$"
        defaultOpInput={account.defaultOpInput}
        onAdd={onAddRow}
        onSet={onSetRow}
        onRemove={onRemoveRow}
      />
    </section>
  );
}
