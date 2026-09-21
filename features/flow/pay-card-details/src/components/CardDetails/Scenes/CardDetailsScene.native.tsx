import React from "react";
import {
  CardAssetDetailsDrawer,
  CardAssetDetailsWithdrawDrawer,
  CardAssetTransactionDetailDrawer,
  CardAssetsManageDrawer,
} from "@features/flow-pay-card-assets";
import { FreezeScene } from "./FreezeScene";
import { MoreScene } from "./MoreScene";
import { OverviewScene } from "./OverviewScene";
import { TransactionScene } from "./TransactionScene";
import type { CardDetailsSceneProps } from "./types";

type CardDetailsSceneComponentProps = CardDetailsSceneProps &
  Readonly<{ onAssetDragActiveChange?: (isDragging: boolean) => void }>;

export function CardDetailsScene({
  route,
  overview,
  freeze,
  more,
  transaction,
  assetDetails,
  assetWithdraw,
  assetsManage,
  assetTransaction,
  onAssetDragActiveChange,
}: CardDetailsSceneComponentProps) {
  switch (route.name) {
    case "freeze":
      return <FreezeScene {...freeze} />;
    case "more":
      return more ? <MoreScene {...more} /> : null;
    case "transaction":
      return transaction ? <TransactionScene {...transaction} /> : null;
    case "assetDetails":
      return assetDetails?.viewModel.selectedAsset ? (
        <CardAssetDetailsDrawer
          asset={assetDetails.viewModel.selectedAsset}
          transactions={assetDetails.viewModel.selectedAssetTransactions}
          formatBalance={assetDetails.viewModel.formatBalance}
          formatters={assetDetails.viewModel.formatters}
          onTopUp={assetDetails.viewModel.onTopUpPress}
          onWithdraw={assetDetails.viewModel.onWithdrawPress}
          onShowHistory={assetDetails.viewModel.onShowHistoryPress}
          onTransactionPress={assetDetails.onTransactionPress}
        />
      ) : null;
    case "assetWithdraw":
      return assetWithdraw ? (
        <CardAssetDetailsWithdrawDrawer onContinue={assetWithdraw.onWithdrawContinue} />
      ) : null;
    case "assetsManage":
      return assetsManage ? (
        <CardAssetsManageDrawer
          rows={assetsManage.viewModel.rows}
          onAddAsset={assetsManage.viewModel.onAddAssetPress}
          onReorder={assetsManage.viewModel.onReorderAssets}
          onDragActiveChange={onAssetDragActiveChange}
          reorderingAssetId={assetsManage.viewModel.reorderingAssetId}
        />
      ) : null;
    case "assetTransaction":
      return assetTransaction ? <CardAssetTransactionDetailDrawer {...assetTransaction} /> : null;
    case "overview":
      return <OverviewScene {...overview} />;
  }
}
