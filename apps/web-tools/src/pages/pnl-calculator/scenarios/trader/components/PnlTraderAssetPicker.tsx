import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { TypedSegmentedControl } from "../../../shared/components/TypedSegmentedControl";
import { getAsset, TRADER_ASSET_IDS } from "../model/assets";
import type { TraderAssetId } from "../model/types";

type PnlTraderAssetPickerProps = Readonly<{
  selectedAssetId: TraderAssetId;
  onSelectedAssetIdChange: (id: TraderAssetId) => void;
}>;

export function PnlTraderAssetPicker({
  selectedAssetId,
  onSelectedAssetIdChange,
}: PnlTraderAssetPickerProps) {
  return (
    <div className="flex flex-col gap-8">
      <span id="trader-asset-label" className="body-3 text-muted">
        Asset
      </span>
      <TypedSegmentedControl
        values={TRADER_ASSET_IDS}
        selected={selectedAssetId}
        onSelect={onSelectedAssetIdChange}
        ariaLabelledBy="trader-asset-label"
        renderLabel={id => {
          const asset = getAsset(id);
          return (
            <span className="flex items-center justify-center gap-8">
              <CryptoIcon ledgerId={asset.currency.id} ticker={asset.ticker} size={20} />
              {asset.ticker}
            </span>
          );
        }}
      />
    </div>
  );
}
