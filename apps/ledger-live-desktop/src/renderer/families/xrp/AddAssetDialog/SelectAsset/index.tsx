import React from "react";
import { useTranslation } from "react-i18next";
import { Button, DialogBody, DialogHeader, Spinner } from "@ledgerhq/lumen-ui-react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { TrackScreen } from "@shared/analytics-react";
import { InfoState } from "@shared/ui-info-state";
import { Search } from "LLD/components/Search";
import { AssetVirtualList } from "LLD/features/ModularDialog/screens/AssetSelector/components/AssetVirtualList";
import { StepScreen } from "../../components/StepScreen";
import { type SelectAssetViewModel, useSelectAssetViewModel } from "./useSelectAssetViewModel";

type Props = Readonly<{
  account: Account;
  onSelect: (token: TokenCurrency) => void;
  onClose: () => void;
}>;

type TokenRowsProps = Readonly<{
  viewModel: SelectAssetViewModel;
  onSelect: (token: TokenCurrency) => void;
}>;

function TokenRows({ viewModel, onSelect }: TokenRowsProps) {
  const { t } = useTranslation();

  if (viewModel.isError) {
    return (
      <div className="flex flex-col items-center gap-16" data-testid="xrp-add-asset-load-error">
        <p className="body-2 text-muted">{t("xrp.addToken.steps.token.loadError")}</p>
        <Button appearance="gray" size="sm" onClick={viewModel.onRetry}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (viewModel.assets.length === 0 && viewModel.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  // The search filters loaded pages only, so the list keeps its loading row while pages remain
  if (viewModel.assets.length === 0 && !viewModel.hasNextPage) {
    return (
      <p className="body-2 text-center text-muted">
        {t("common.selectNoResults", { query: viewModel.query })}
      </p>
    );
  }

  return (
    <AssetVirtualList
      key={viewModel.query}
      assets={viewModel.assets}
      hasNextPage={viewModel.hasNextPage}
      onVisibleItemsScrollEnd={viewModel.onLoadNext}
      onClick={asset => {
        const token = viewModel.findToken(asset);
        if (token) onSelect(token);
      }}
    />
  );
}

export function SelectAsset({ account, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const viewModel = useSelectAssetViewModel(account);

  // The list layout is the modular dialog's asset selector, which the add account flow opens
  return (
    <>
      <TrackScreen category="XRP add token" name="Step Token" />
      {viewModel.isEmpty ? (
        <StepScreen onClose={onClose}>
          <InfoState
            preset="error"
            size="hug"
            testID="xrp-add-asset-empty"
            title={t("xrp.addToken.noAssets")}
            description={t("xrp.addToken.steps.token.empty")}
            primaryCta={{ label: t("xrp.manageAssets.editAsset.gotIt"), onPress: onClose }}
          />
        </StepScreen>
      ) : (
        <>
          <DialogHeader
            density="expanded"
            title={t("xrp.addToken.selectAsset")}
            onClose={onClose}
          />
          <DialogBody className="px-16!">
            <div className="flex h-[450px] w-full flex-col overflow-hidden">
              <div className="mb-12 px-8 pt-4">
                <Search
                  value={viewModel.search}
                  placeholder={t("common.searchWithoutEllipsis")}
                  onChange={event => viewModel.onChangeSearch(event.target.value)}
                  data-testid="xrp-add-asset-search"
                />
              </div>
              <TokenRows viewModel={viewModel} onSelect={onSelect} />
            </div>
          </DialogBody>
        </>
      )}
    </>
  );
}
