import { Button } from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { TraderMultiVM } from "../useTraderViewModel";
import { PnlTraderAccountSection } from "./PnlTraderAccountSection";

type MultiAccountsListProps = Readonly<{
  multi: TraderMultiVM;
  fiatTicker: string;
}>;

export function MultiAccountsList({ multi, fiatTicker }: MultiAccountsListProps) {
  return (
    <div className="flex flex-col gap-16">
      {multi.accounts.map((account, idx) => (
        <PnlTraderAccountSection
          key={account.id}
          account={account}
          index={idx}
          fiatCode={fiatTicker}
          canRemove={multi.canRemove}
          onAssetChange={next => multi.actions.setAssetId(account.id, next)}
          onCurrentPriceChange={next => multi.actions.setCurrentPrice(account.id, next)}
          onAddRow={values => multi.actions.addRow(account.id, values)}
          onSetRow={(rowId, values) => multi.actions.setRow(account.id, rowId, values)}
          onRemoveRow={rowId => multi.actions.removeRow(account.id, rowId)}
          onRemove={() => multi.actions.remove(account.id)}
        />
      ))}

      <Button appearance="gray" size="sm" icon={Plus} onClick={() => multi.actions.add("BTC")}>
        Add account
      </Button>
    </div>
  );
}
