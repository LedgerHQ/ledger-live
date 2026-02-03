import React, { memo } from "react";
import { TFunction } from "i18next";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { SortTableCell } from "~/renderer/screens/market/components/SortTableCell";
import { TableCell, TableRow } from "~/renderer/screens/market/components/Table";
import { Star, StarFill } from "@ledgerhq/lumen-ui-react/symbols";

type ListHeaderProps = {
  order?: Order;
  starredMarketCoins: string[];
  starred?: string[];
  onToggleSortBy: () => void;
  onToggleFilterByStarredAccounts: () => void;
  t: TFunction;
};

export const ListHeader = memo<ListHeaderProps>(function ListHeader({
  order,
  starredMarketCoins,
  starred,
  onToggleSortBy,
  onToggleFilterByStarredAccounts,
  t,
}) {
  return (
    <div className="px-20" data-testid="market-list-header">
      <TableRow header>
        <SortTableCell data-testid="market-sort-button" onClick={onToggleSortBy} order={order}>
          #
        </SortTableCell>
        <TableCell disabled>{t("market.marketList.crypto")}</TableCell>
        <TableCell disabled>{t("market.marketList.price")}</TableCell>
        <TableCell disabled>{t("market.marketList.change")}</TableCell>
        <TableCell disabled>{t("market.marketList.marketCap")}</TableCell>
        <TableCell disabled>{t("market.marketList.last7d")}</TableCell>
        <TableCell
          data-testid="market-star-button"
          disabled={starredMarketCoins.length <= 0 && (!starred || starred.length <= 0)}
          onClick={onToggleFilterByStarredAccounts}
        >
          {starred && starred.length > 0 ? (
            <StarFill size={16} />
          ) : (
            <Star size={16} style={{ fill: "none" }} />
          )}
        </TableCell>
      </TableRow>
    </div>
  );
});
