import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  SearchInput,
  Spinner,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { useTokenOptions } from "../AddTokenModal/useTokenOptions";
import { StepScreen } from "../components/StepScreen";

const LOAD_NEXT_THRESHOLD = 48;

type Props = Readonly<{
  account: Account;
  onSelect: (token: TokenCurrency) => void;
  onClose: () => void;
}>;

function matchesSearch(token: TokenCurrency, query: string): boolean {
  return [token.name, token.ticker, token.contractAddress].some(value =>
    value.toLowerCase().includes(query),
  );
}

function TokenListContent({
  tokens,
  isLoading,
  isError,
  onRetry,
  onSelect,
}: Readonly<{
  tokens: TokenCurrency[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelect: (token: TokenCurrency) => void;
}>) {
  const { t } = useTranslation();

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-16" data-testid="xrp-add-token-load-error">
        <p className="body-2 text-muted">{t("xrp.addToken.steps.token.loadError")}</p>
        <Button appearance="gray" size="sm" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (tokens.length === 0 && isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  if (tokens.length === 0) {
    return <p className="body-2 text-center text-muted">{t("xrp.addToken.steps.token.empty")}</p>;
  }

  return (
    <div className="flex flex-col">
      {tokens.map(token => (
        <ListItem
          key={token.id}
          onClick={() => onSelect(token)}
          data-testid={`xrp-add-token-option-${token.id}`}
        >
          <ListItemLeading>
            <CryptoIcon
              ledgerId={token.id}
              ticker={token.ticker}
              network={token.parentCurrencyId}
              size={40}
            />
            <ListItemContent>
              <ListItemTitle>{token.name}</ListItemTitle>
              <ListItemDescription>{token.ticker}</ListItemDescription>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      ))}
    </div>
  );
}

export function SelectToken({ account, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { options, isLoading, isError, loadNext, retry } = useTokenOptions(account);
  const query = search.trim().toLowerCase();
  const tokens = query ? options.filter(token => matchesSearch(token, query)) : options;

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const body = event.currentTarget;
    const isAtEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - LOAD_NEXT_THRESHOLD;
    if (isAtEnd) loadNext?.();
  };

  return (
    <StepScreen title={t("modularAssetDrawer.selectAsset")} onClose={onClose} onScroll={onScroll}>
      <SearchInput
        placeholder={t("common.searchWithoutEllipsis")}
        value={search}
        onChange={event => setSearch(event.target.value)}
        onClear={() => setSearch("")}
        data-testid="xrp-add-token-search"
      />
      <TokenListContent
        tokens={tokens}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
        onSelect={onSelect}
      />
    </StepScreen>
  );
}
