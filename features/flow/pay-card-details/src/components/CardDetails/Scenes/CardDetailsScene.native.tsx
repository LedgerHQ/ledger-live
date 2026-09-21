import React from "react";
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
    case "overview":
      return <OverviewScene {...overview} />;
  }
}
