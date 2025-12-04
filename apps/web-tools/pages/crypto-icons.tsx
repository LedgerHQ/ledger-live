import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { Currency } from "@ledgerhq/types-cryptoassets";

export const getStaticProps = async () => ({ props: {} });

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const InputSection = styled.div`
  margin-bottom: 30px;
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  margin-top: 10px;
  padding: 10px;
  background-color: #ffe6e6;
  border-radius: 4px;
`;

const DataSection = styled.div`
  margin-top: 30px;
`;

const DataBlock = styled.pre`
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  overflow-y: auto;
  font-size: 10px;
  line-height: 1.4;
  max-height: 300px;
  max-width: 800px;
`;

const IconsSection = styled.div`
  margin-top: 30px;
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
`;

const IconContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const IconLabel = styled.div`
  font-weight: bold;
  font-size: 14px;
`;

const ModeSelector = styled.div`
  margin-bottom: 20px;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 10px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
`;

const App = () => {
  const [mode, setMode] = useState<"id" | "address">("id");
  const [id, setId] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onModeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMode(e.target.value as "id" | "address");
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

  const iconSize = "56px";

  return (
    <Container>
      <h1>Crypto Icons Viewer</h1>
      <p>View crypto currency and token icons by ID or contract address</p>

      <InputSection>
        <form onSubmit={onSubmit}>
          <ModeSelector>
            <Label>Search Mode</Label>
            <RadioGroup>
              <RadioLabel>
                <input type="radio" value="id" checked={mode === "id"} onChange={onModeChange} />
                <span>By ID</span>
              </RadioLabel>
              <RadioLabel>
                <input
                  type="radio"
                  value="address"
                  checked={mode === "address"}
                  onChange={onModeChange}
                />
                <span>By Contract Address + Network</span>
              </RadioLabel>
            </RadioGroup>
          </ModeSelector>

          {mode === "id" ? (
            <InputGroup>
              <Label htmlFor="currency-id">Currency/Token ID</Label>
              <Input
                id="currency-id"
                name="currency-id"
                type="text"
                value={id}
                onChange={onIdChange}
                placeholder="e.g., bitcoin, ethereum, ethereum/erc20/usd__coin"
                autoComplete="off"
              />
            </InputGroup>
          ) : (
            <>
              <InputGroup>
                <Label htmlFor="contract-address">Contract Address</Label>
                <Input
                  id="contract-address"
                  name="contract-address"
                  type="text"
                  value={contractAddress}
                  onChange={onContractAddressChange}
                  placeholder="e.g., 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
                  autoComplete="off"
                />
              </InputGroup>
              <InputGroup>
                <Label htmlFor="network">Network (Currency ID)</Label>
                <Input
                  id="network"
                  name="network"
                  type="text"
                  value={network}
                  onChange={onNetworkChange}
                  placeholder="e.g., ethereum, polygon, bsc"
                  autoComplete="off"
                />
              </InputGroup>
            </>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </Button>

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </form>
      </InputSection>

      {currency && (currency.type === "CryptoCurrency" || currency.type === "TokenCurrency") && (
        <>
          <IconsSection>
            <IconContainer>
              <IconLabel>Circle Mode</IconLabel>
              {currency.type === "TokenCurrency" ? (
                <CryptoIcon
                  ledgerId={currency.id}
                  ticker={currency.ticker}
                  size={iconSize}
                  network={currency.parentCurrency.id}
                />
              ) : (
                <CryptoIcon ledgerId={currency.id} ticker={currency.ticker} size={iconSize} />
              )}
            </IconContainer>

            <IconContainer>
              <IconLabel>Square Mode</IconLabel>
              {currency.type === "TokenCurrency" ? (
                <CryptoIcon
                  ledgerId={currency.id}
                  ticker={currency.ticker}
                  size={iconSize}
                  network={currency.parentCurrency.id}
                  overridesRadius="16px"
                />
              ) : (
                <CryptoIcon
                  ledgerId={currency.id}
                  ticker={currency.ticker}
                  size={iconSize}
                  overridesRadius="16px"
                />
              )}
            </IconContainer>
          </IconsSection>

          <DataSection>
            <h2>Currency/Token Data</h2>
            <DataBlock>{JSON.stringify(currency, null, 2)}</DataBlock>
          </DataSection>
        </>
      )}
    </Container>
  );
};

export default App;
