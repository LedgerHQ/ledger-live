import { PnlAmountField } from "../../../shared/components/PnlAmountField";
import type { TraderSingleVM } from "../useTraderViewModel";
import { PnlTraderAssetPicker } from "./PnlTraderAssetPicker";
import { PnlTraderOperationsEditor } from "./PnlTraderOperationsEditor";

type SingleAssetInputsProps = Readonly<{
  single: TraderSingleVM;
  fiatTicker: string;
}>;

export function SingleAssetInputs({ single, fiatTicker }: SingleAssetInputsProps) {
  return (
    <>
      <PnlTraderAssetPicker
        selectedAssetId={single.assetId}
        onSelectedAssetIdChange={single.actions.setAssetId}
      />

      <PnlAmountField
        id="trader-current-price"
        label="Current price"
        value={single.currentPriceUsd}
        currencySymbol="$"
        onChange={single.actions.setCurrentPrice}
      />

      <PnlTraderOperationsEditor
        rows={single.rows}
        assetTicker={single.ticker}
        fiatCode={fiatTicker}
        fiatSymbol="$"
        defaultOpInput={single.defaultOpInput}
        onAdd={single.actions.addRow}
        onSet={single.actions.setRow}
        onRemove={single.actions.removeRow}
      />
    </>
  );
}
