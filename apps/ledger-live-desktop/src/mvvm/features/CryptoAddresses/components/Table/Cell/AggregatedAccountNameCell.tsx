import React, { useCallback, useRef, useState } from "react";
import {
  TableCellItem,
  TableCellContent,
  TableCellContentTitle,
  Tag,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import type { Account } from "@ledgerhq/types-live";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";

type AggregatedAccountNameCellProps = {
  readonly account: Account;
  readonly displayName: string;
  readonly tag?: string;
};

const isOverflowing = (element: Element) => element.scrollWidth > element.clientWidth;

function AccountTag({ label }: Readonly<{ label: string }>) {
  const tagRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setOpen(false);
      return;
    }
    const tag = tagRef.current;
    const isLabelCut = tag !== null && [tag, ...tag.querySelectorAll("*")].some(isOverflowing);
    setOpen(isLabelCut);
  }, []);

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        <Tag ref={tagRef} label={label} size="sm" appearance="gray" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function AggregatedAccountNameCell({
  account,
  displayName,
  tag,
}: AggregatedAccountNameCellProps) {
  return (
    <TableCellItem>
      <SquaredCryptoIcon
        ledgerId={account.currency.id}
        ticker={account.currency.ticker}
        size={32}
      />
      <TableCellContent>
        <div className="flex min-w-0 items-center gap-8">
          <TableCellContentTitle>{displayName}</TableCellContentTitle>
          {tag ? <AccountTag label={tag} /> : null}
        </div>
      </TableCellContent>
    </TableCellItem>
  );
}
