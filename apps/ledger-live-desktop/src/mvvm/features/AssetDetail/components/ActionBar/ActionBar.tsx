import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ArrowDown, ArrowUp, Minus, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { ActionBarViewModel } from "./useActionBarViewModel";

type ActionBarViewProps = Readonly<{
  viewModel: ActionBarViewModel;
}>;

export function ActionBarView({ viewModel }: ActionBarViewProps) {
  return (
    <div className="flex flex-wrap items-center gap-12" data-testid="asset-detail-action-bar">
      <Button
        appearance="base"
        size="sm"
        icon={ArrowDown}
        onClick={viewModel.onReceive}
        className="rounded-full"
        data-testid="asset-detail-action-receive"
      >
        {viewModel.receiveLabel}
      </Button>

      <Button
        appearance="transparent"
        size="sm"
        icon={Plus}
        onClick={viewModel.onBuy}
        disabled={!viewModel.isBuyEnabled}
        className="rounded-full"
        data-testid="asset-detail-action-buy"
      >
        {viewModel.buyLabel}
      </Button>

      <Button
        appearance="transparent"
        size="sm"
        icon={Minus}
        onClick={viewModel.onSell}
        disabled={!viewModel.isSellEnabled}
        className="rounded-full"
        data-testid="asset-detail-action-sell"
      >
        {viewModel.sellLabel}
      </Button>

      <Button
        appearance="transparent"
        size="sm"
        icon={ArrowUp}
        onClick={viewModel.onSend}
        disabled={!viewModel.isSendEnabled}
        className="rounded-full"
        data-testid="asset-detail-action-send"
      >
        {viewModel.sendLabel}
      </Button>
    </div>
  );
}
