import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import type { BalanceItem } from "../components/AccountBalanceSummary/AccountBalanceSummary.types";
import { displayValue } from "./displayValue";

type Props = Readonly<{ item: BalanceItem; discreet: boolean; testID?: string }>;

export const BalanceCard = ({ item, discreet, testID }: Props) => (
  <Card type="info" className="min-w-[12rem] flex-1" data-testid={testID}>
    <CardHeader>
      <CardLeading>
        <CardContent>
          <div className="flex min-w-0 items-center gap-4 text-muted">
            <CardContentTitle>
              <span className="body-3">{item.label}</span>
            </CardContentTitle>
            {item.description ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex cursor-help" aria-label={item.label}>
                    <Information size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{item.description}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          <CardContentDescription>
            <span className="text-base body-2-semi-bold">{displayValue(item, discreet)}</span>
          </CardContentDescription>
        </CardContent>
      </CardLeading>
    </CardHeader>
  </Card>
);
