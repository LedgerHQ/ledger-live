import { Button, Tag } from "@ledgerhq/lumen-ui-react";
import type { PayCardMockTransactionAsset, PayCardTransactionsMockProps } from "../../types";
import { Section } from "../Section/Section";

const ASSETS: readonly PayCardMockTransactionAsset[] = ["usdc", "btc", "eth"];

export interface TransactionsScreenProps extends PayCardTransactionsMockProps {
  readonly onBack: () => void;
}

export function TransactionsScreen({
  available,
  isOverridden,
  count,
  fill,
  empty,
  receive,
  receiveMultiAsset,
  clear,
  onBack,
}: TransactionsScreenProps) {
  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="flex p-16">
        <Button appearance="gray" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>

      <Section title="Transaction mock">
        <div className="flex flex-wrap gap-8">
          <Tag
            size="sm"
            appearance={available ? "success" : "warning"}
            label={available ? "MSW enabled" : "MSW disabled"}
          />
          <Tag
            size="sm"
            appearance={isOverridden ? "success" : "gray"}
            label={isOverridden ? `${count} mocked` : "Provider / mock session"}
          />
        </div>
        <p className="body-3 text-muted">
          Changes invalidate the Card transaction cache, so an open Pay screen refreshes
          automatically.
        </p>
        <div className="flex flex-wrap gap-8">
          <Button appearance="gray" size="sm" disabled={!available} onClick={fill}>
            Full fixture
          </Button>
          <Button appearance="gray" size="sm" disabled={!available} onClick={empty}>
            Empty list
          </Button>
          <Button appearance="gray" size="sm" disabled={!available} onClick={clear}>
            Use provider
          </Button>
        </div>
      </Section>

      <Section title="Receive transaction">
        <p className="body-3 text-muted">
          Adds one newest charge funded only by that asset, or one funded by several. Repeat to
          build a longer history.
        </p>
        <div className="flex flex-wrap gap-8">
          {ASSETS.map(asset => (
            <Button
              key={asset}
              appearance="base"
              size="sm"
              disabled={!available}
              onClick={() => receive(asset)}
            >
              Receive {asset.toUpperCase()}
            </Button>
          ))}
          <Button appearance="base" size="sm" disabled={!available} onClick={receiveMultiAsset}>
            Receive multi-asset
          </Button>
        </div>
      </Section>
    </div>
  );
}
