import React, { useState, useCallback } from "react";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  Button,
  SegmentedControl,
  SegmentedControlButton,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { ToolPage } from "../components/ToolPage";

const iconSize = 56;

const App = () => {
  const [mode, setMode] = useState<"id" | "address">("id");
  const [id, setId] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onModeChange = useCallback((value: string) => {
    setMode(value as "id" | "address");
    setCurrency(null);
    setError(null);
  }, []);

  const onIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setId(e.target.value);
    setCurrency(null);
    setError(null);
  }, []);

  const onContractAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value);
    setCurrency(null);
    setError(null);
  }, []);

  const onNetworkChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNetwork(e.target.value);
    setCurrency(null);
    setError(null);
  }, []);

  const findCurrencyById = useCallback(async (currencyId: string): Promise<Currency | null> => {
    // Try to find as token first
    const token = await getCryptoAssetsStore()
      .findTokenById(currencyId)
      .catch(() => null);
    if (token) {
      return token;
    }

    // If not found as token, try as crypto currency
    const crypto = findCryptoCurrencyById(currencyId);
    return crypto || null;
  }, []);

  const findTokenByAddress = useCallback(
    async (address: string, networkId: string): Promise<Currency | null> => {
      const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(address, networkId);
      return token || null;
    },
    [],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setCurrency(null);

      try {
        if (mode === "id") {
          const trimmedId = id.trim();
          if (!trimmedId) {
            setError("Please enter an ID");
            setLoading(false);
            return;
          }

          const resolvedCurrency = await findCurrencyById(trimmedId);
          if (resolvedCurrency === null) {
            setError(`No currency or token found with ID: ${id}`);
          } else {
            setCurrency(resolvedCurrency);
          }
        } else {
          const trimmedAddress = contractAddress.trim();
          const trimmedNetwork = network.trim();
          if (!trimmedAddress || !trimmedNetwork) {
            setError("Please enter both contract address and network");
            setLoading(false);
            return;
          }

          try {
            const token = await findTokenByAddress(trimmedAddress, trimmedNetwork);
            if (token === null) {
              setError(
                `No token found with contract address ${contractAddress} on network ${network}`,
              );
            } else {
              setCurrency(token);
            }
          } catch (error) {
            setError(
              `Error finding token: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      } catch (error) {
        setError(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    },
    [mode, id, contractAddress, network, findCurrencyById, findTokenByAddress],
  );

  return (
    <ToolPage
      title="Crypto Icons"
      description="View crypto currency and token icons by id or contract address."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-16">
        <SegmentedControl
          selectedValue={mode}
          onSelectedChange={onModeChange}
          tabLayout="fit"
          className="self-start"
          aria-label="Lookup mode"
        >
          <SegmentedControlButton value="id">By id</SegmentedControlButton>
          <SegmentedControlButton value="address">By contract address</SegmentedControlButton>
        </SegmentedControl>

        {mode === "id" ? (
          <TextInput
            label="Currency / token id"
            value={id}
            onChange={onIdChange}
            placeholder="e.g. bitcoin, ethereum, ethereum/erc20/usd__coin"
            autoComplete="off"
          />
        ) : (
          <>
            <TextInput
              label="Contract address"
              value={contractAddress}
              onChange={onContractAddressChange}
              placeholder="e.g. 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
              autoComplete="off"
            />
            <TextInput
              label="Network (currency id)"
              value={network}
              onChange={onNetworkChange}
              placeholder="e.g. ethereum, polygon, bsc"
              autoComplete="off"
            />
          </>
        )}

        <Button type="submit" appearance="accent" loading={loading} className="self-start">
          {loading ? "Loading…" : "Search"}
        </Button>

        {error ? <p className="body-2 text-error">{error}</p> : null}
      </form>

      {currency && (currency.type === "CryptoCurrency" || currency.type === "TokenCurrency") && (
        <>
          <div className="flex flex-wrap gap-24">
            <IconPreview label="Circle">
              <CryptoIconFor currency={currency} />
            </IconPreview>
            <IconPreview label="Square">
              <CryptoIconFor currency={currency} shape="square" />
            </IconPreview>
          </div>

          <div className="flex flex-col gap-8">
            <h2 className="heading-5 text-base">Currency / token data</h2>
            <pre className="max-h-[40vh] overflow-auto rounded-lg border border-base bg-muted p-16 body-3 text-base">
              {JSON.stringify(currency, null, 2)}
            </pre>
          </div>
        </>
      )}
    </ToolPage>
  );
};

function IconPreview({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-10 rounded-lg border border-base bg-base p-16">
      <span className="body-3-semi-bold text-muted">{label}</span>
      {children}
    </div>
  );
}

function CryptoIconFor({
  currency,
  shape,
}: {
  currency: CryptoCurrency | TokenCurrency;
  shape?: "square";
}) {
  if (currency.type === "TokenCurrency") {
    return (
      <CryptoIcon
        ledgerId={currency.id}
        ticker={currency.ticker}
        size={iconSize}
        network={currency.parentCurrencyId}
        shape={shape}
      />
    );
  }
  return (
    <CryptoIcon ledgerId={currency.id} ticker={currency.ticker} size={iconSize} shape={shape} />
  );
}

export default App;
