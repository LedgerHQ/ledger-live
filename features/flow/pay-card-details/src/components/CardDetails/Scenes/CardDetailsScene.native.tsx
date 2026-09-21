import React from "react";
import {
  CardAssetDetailsDrawer,
  CardAssetDetailsWithdrawDrawer,
} from "@features/flow-pay-card-assets";
import { AddToWalletScene } from "./AddToWalletScene";
import { FreezeScene } from "./FreezeScene";
import { MoreScene } from "./MoreScene";
import { OverviewScene } from "./OverviewScene";
import { TransactionScene } from "./TransactionScene";
import type { CardDetailsSceneProps } from "./types";

export function CardDetailsScene({
  route,
  overview,
  freeze,
  more,
  addToWallet,
  transaction,
  assetDetails,
  assetWithdraw,
}: CardDetailsSceneProps) {
  switch (route.name) {
    case "freeze":
      return <FreezeScene {...freeze} />;
    case "more":
      return more ? <MoreScene {...more} /> : null;
    case "addToWallet":
      return <AddToWalletScene {...addToWallet} />;
    case "transaction":
      return transaction ? <TransactionScene {...transaction} /> : null;
    case "assetDetails":
      return assetDetails?.viewModel.selectedAsset ? (
        <CardAssetDetailsDrawer
          asset={assetDetails.viewModel.selectedAsset}
          transactions={assetDetails.viewModel.selectedAssetTransactions}
          copy={assetDetails.viewModel.dialogCopy}
          formatBalance={assetDetails.viewModel.formatBalance}
          formatters={assetDetails.viewModel.formatters}
          onTopUp={assetDetails.viewModel.onTopUpPress}
          onWithdraw={assetDetails.viewModel.onWithdrawPress}
          onShowHistory={assetDetails.viewModel.onShowHistoryPress}
        />
      ) : null;
    case "assetWithdraw":
      return assetWithdraw ? (
        <CardAssetDetailsWithdrawDrawer
          copy={assetWithdraw.dialogCopy}
          onContinue={assetWithdraw.onWithdrawContinue}
        />
      ) : null;
    case "overview":
      return <OverviewScene {...overview} />;
  }
}
