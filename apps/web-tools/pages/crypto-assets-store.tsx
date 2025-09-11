import React, { useState } from "react";
import { CryptoAssetsStore } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";

/**
 * ===================================================================
 * POC: IMPLEMENTATION DU CONTRAT CryptoAssetsStore
 * ===================================================================
 * 
 * Cette implémentation utilise l'API crypto-assets-service pour 
 * récupérer les tokens selon le contrat CryptoAssetsStore de Ledger Live.
 * 
 * API: https://crypto-assets-service.api.ledger-test.com
 */

class CryptoAssetsStoreImpl implements CryptoAssetsStore {
  private baseUrl = "https://crypto-assets-service.api.ledger-test.com";

  private convertApiTokenToTokenCurrency(token: any): TokenCurrency | undefined {
    // Try to find the parent currency using the network field
    const parentCurrency = findCryptoCurrencyById(token.network);
    
    // If not found, return undefined instead of creating a fake one
    if (!parentCurrency) {
      console.warn(`Parent currency not found for network: ${token.network}`);
      return undefined;
    }
    
    return {
      type: "TokenCurrency" as const,
      id: token.id,
      name: token.name,
      ticker: token.ticker,
      contractAddress: token.contract_address || "",
      parentCurrency,
      tokenType: token.standard || "",
      units: token.units || [{ code: token.ticker, name: token.name, magnitude: token.decimals || 18 }],
    };
  }

  private async fetchFromApi(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Always request essential fields
    const defaultParams = {
      output: "id,name,ticker,contract_address,standard,decimals,network,network_family,units,type",
      ...params
    };

    Object.entries(defaultParams).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      throw error;
    }
  }

  async findTokenByAddress(address: string): Promise<TokenCurrency | undefined> {
    try {
      const data = await this.fetchFromApi("/v1/tokens", {
        contract_address: address,
        limit: "1"
      });
      
      const tokens = Object.values(data);
      if (tokens.length === 0) return undefined;
      
      return this.convertApiTokenToTokenCurrency(tokens[0]);
    } catch (error) {
      console.error("Error in findTokenByAddress:", error);
      return undefined;
    }
  }

  async getTokenById(id: string): Promise<TokenCurrency> {
    const token = await this.findTokenById(id);
    if (!token) {
      throw new Error(`Token with id ${id} not found`);
    }
    return token;
  }

  async findTokenById(id: string): Promise<TokenCurrency | undefined> {
    try {
      const data = await this.fetchFromApi("/v1/tokens", {
        id: id,
        limit: "1"
      });
      
      const tokens = Object.values(data);
      if (tokens.length === 0) return undefined;
      
      return this.convertApiTokenToTokenCurrency(tokens[0]);
    } catch (error) {
      console.error("Error in findTokenById:", error);
      return undefined;
    }
  }

  async findTokenByAddressInCurrency(
    address: string,
    currencyId: string,
  ): Promise<TokenCurrency | undefined> {
    try {
      const data = await this.fetchFromApi("/v1/tokens", {
        contract_address: address,
        network: currencyId,
        limit: "1"
      });
      
      const tokens = Object.values(data);
      if (tokens.length === 0) return undefined;
      
      return this.convertApiTokenToTokenCurrency(tokens[0]);
    } catch (error) {
      console.error("Error in findTokenByAddressInCurrency:", error);
      return undefined;
    }
  }

  async findTokenByTicker(ticker: string): Promise<TokenCurrency | undefined> {
    try {
      const data = await this.fetchFromApi("/v1/tokens", {
        ticker: ticker,
        limit: "1"
      });
      
      const tokens = Object.values(data);
      if (tokens.length === 0) return undefined;
      
      return this.convertApiTokenToTokenCurrency(tokens[0]);
    } catch (error) {
      console.error("Error in findTokenByTicker:", error);
      return undefined;
    }
  }
}

/**
 * ===================================================================
 * UI DE TEST
 * ===================================================================
 */

interface MethodState {
  loading: boolean;
  result: any;
  error: string | null;
  expanded: boolean;
}

interface MethodAccordionProps {
  title: string;
  description: string;
  expanded: boolean;
  loading: boolean;
  error: string | null;
  result: any;
  onToggle: () => void;
  children: React.ReactNode;
}

function MethodAccordion({ 
  title, 
  description, 
  expanded, 
  loading, 
  error, 
  result, 
  onToggle, 
  children 
}: MethodAccordionProps) {
  return (
    <div style={{ marginBottom: "15px", border: "1px solid #ccc", borderRadius: "4px" }}>
      <div 
        style={{ 
          padding: "10px", 
          backgroundColor: "#f8f9fa", 
          cursor: "pointer", 
          borderBottom: expanded ? "1px solid #ccc" : "none" 
        }}
        onClick={onToggle}
      >
        <h3 style={{ margin: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {title}
          <span style={{ fontSize: "0.8em" }}>{expanded ? "▼" : "▶"}</span>
        </h3>
      </div>
      {expanded && (
        <div style={{ padding: "10px" }}>
          <p style={{ fontSize: "0.9em", color: "#666", marginTop: 0 }}>
            {description}
          </p>
          {children}
          
          {loading && <div style={{ color: "blue", marginTop: "10px" }}>Chargement...</div>}
          
          {error && (
            <div style={{ color: "red", padding: "10px", backgroundColor: "#ffe6e6", marginTop: "10px" }}>
              <strong>Erreur:</strong> {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: "10px" }}>
              <h4>Résultat:</h4>
              <div style={{ backgroundColor: "#f5f5f5", padding: "10px", border: "1px solid #ddd" }}>
                <p><strong>Méthode:</strong> {result.method}</p>
                <p><strong>Arguments:</strong> {JSON.stringify(result.args)}</p>
                <p><strong>Résultat:</strong></p>
                <pre style={{ backgroundColor: "white", padding: "10px", overflow: "auto" }}>
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExampleList({ examples }: { examples: string[] }) {
  return (
    <div style={{ fontSize: "0.8em", color: "#888", marginTop: "5px" }}>
      <div>Exemples:</div>
      <pre style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "8px", 
        margin: "5px 0", 
        border: "1px solid #e9ecef", 
        borderRadius: "3px",
        fontSize: "0.9em",
        whiteSpace: "pre-wrap"
      }}>
        {examples.join('\n')}
      </pre>
    </div>
  );
}

export const getStaticProps = async () => ({ props: {} });

export default function CryptoAssetsStorePage() {
  const [store] = useState(() => new CryptoAssetsStoreImpl());
  
  const [address, setAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [ticker, setTicker] = useState("");
  const [methodStates, setMethodStates] = useState<Record<string, MethodState>>({
    findTokenByAddress: { loading: false, result: null, error: null, expanded: false },
    findTokenById: { loading: false, result: null, error: null, expanded: false },
    getTokenById: { loading: false, result: null, error: null, expanded: false },
    findTokenByAddressInCurrency: { loading: false, result: null, error: null, expanded: false },
    findTokenByTicker: { loading: false, result: null, error: null, expanded: false },
  });

  const executeMethod = async (methodName: string, ...args: any[]) => {
    setMethodStates(prev => ({
      ...prev,
      [methodName]: { ...prev[methodName], loading: true, error: null, result: null, expanded: true }
    }));

    try {
      const method = (store as any)[methodName];
      const res = await method.apply(store, args);
      setMethodStates(prev => ({
        ...prev,
        [methodName]: { ...prev[methodName], loading: false, result: { method: methodName, args, result: res } }
      }));
    } catch (err: any) {
      setMethodStates(prev => ({
        ...prev,
        [methodName]: { ...prev[methodName], loading: false, error: err.message }
      }));
    }
  };

  const toggleExpanded = (methodName: string) => {
    setMethodStates(prev => ({
      ...prev,
      [methodName]: { ...prev[methodName], expanded: !prev[methodName].expanded }
    }));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Crypto Assets Store POC</h1>
      <p>Test implementation du contrat CryptoAssetsStore avec l&apos;API crypto-assets-service</p>

      <div style={{ marginBottom: "20px" }}>
        <h2>Méthodes disponibles:</h2>
        
        <MethodAccordion
          title="findTokenByAddress"
          description="Recherche un token par son adresse de contrat."
          expanded={methodStates.findTokenByAddress.expanded}
          loading={methodStates.findTokenByAddress.loading}
          error={methodStates.findTokenByAddress.error}
          result={methodStates.findTokenByAddress.result}
          onToggle={() => toggleExpanded("findTokenByAddress")}
        >
          <input
            type="text"
            placeholder="Contract address (e.g., 0xa0b86a33e6b6daacfe84b4391bb4ac088b2e83d9)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ width: "400px", marginRight: "10px" }}
          />
          <button onClick={() => executeMethod("findTokenByAddress", address)}>
            Rechercher
          </button>
          <ExampleList examples={[
            "0xdAC17F958D2ee523a2206206994597C13D831ec7 (USDT sur Ethereum)",
            "0xaf88d065e77c8cC2239327C5EDb3A432268e5831 (USDC sur Arbitrum)",
            "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 (USDT sur Arbitrum)"
          ]} />
        </MethodAccordion>

        <MethodAccordion
          title="getTokenById / findTokenById"
          description="Recherche un token par son ID CAL. getTokenById lance une exception si non trouvé."
          expanded={methodStates.findTokenById.expanded}
          loading={methodStates.findTokenById.loading || methodStates.getTokenById.loading}
          error={methodStates.findTokenById.error || methodStates.getTokenById.error}
          result={methodStates.findTokenById.result || methodStates.getTokenById.result}
          onToggle={() => {
            toggleExpanded("findTokenById");
            if (!methodStates.findTokenById.expanded) {
              setMethodStates(prev => ({ ...prev, getTokenById: { ...prev.getTokenById, expanded: true } }));
            }
          }}
        >
          <input
            type="text"
            placeholder="Token ID (e.g., ethereum/erc20/usdt)"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            style={{ width: "400px", marginRight: "10px" }}
          />
          <button onClick={() => executeMethod("findTokenById", tokenId)} style={{ marginRight: "10px" }}>
            Find
          </button>
          <button onClick={() => executeMethod("getTokenById", tokenId)}>
            Get (throws if not found)
          </button>
          <ExampleList examples={[
            "ethereum/erc20/usd_tether__erc20_",
            "ethereum/erc20/usd__coin",
            "arbitrum/erc20/usd_coin",
            "arbitrum/erc20/tether_usd"
          ]} />
        </MethodAccordion>

        <MethodAccordion
          title="findTokenByAddressInCurrency"
          description="Recherche un token par son adresse de contrat dans une currency spécifique."
          expanded={methodStates.findTokenByAddressInCurrency.expanded}
          loading={methodStates.findTokenByAddressInCurrency.loading}
          error={methodStates.findTokenByAddressInCurrency.error}
          result={methodStates.findTokenByAddressInCurrency.result}
          onToggle={() => toggleExpanded("findTokenByAddressInCurrency")}
        >
          <input
            type="text"
            placeholder="Contract address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ width: "200px", marginRight: "10px" }}
          />
          <input
            type="text"
            placeholder="Currency ID (e.g., ethereum)"
            value={currencyId}
            onChange={(e) => setCurrencyId(e.target.value)}
            style={{ width: "200px", marginRight: "10px" }}
          />
          <button onClick={() => executeMethod("findTokenByAddressInCurrency", address, currencyId)}>
            Rechercher
          </button>
          <ExampleList examples={[
            "Address: 0xdAC17F958D2ee523a2206206994597C13D831ec7, Currency: ethereum",
            "Address: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831, Currency: arbitrum",
            "Currency IDs disponibles: ethereum, arbitrum, polygon, avalanche_c_chain, bsc..."
          ]} />
        </MethodAccordion>

        <MethodAccordion
          title="findTokenByTicker"
          description="Recherche un token par son ticker. Retourne le premier match trouvé."
          expanded={methodStates.findTokenByTicker.expanded}
          loading={methodStates.findTokenByTicker.loading}
          error={methodStates.findTokenByTicker.error}
          result={methodStates.findTokenByTicker.result}
          onToggle={() => toggleExpanded("findTokenByTicker")}
        >
          <input
            type="text"
            placeholder="Ticker (e.g., USDT)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            style={{ width: "400px", marginRight: "10px" }}
          />
          <button onClick={() => executeMethod("findTokenByTicker", ticker)}>
            Rechercher
          </button>
          <ExampleList examples={[
            "Exemples de tickers: USDT, USDC, WETH, UNI, LINK, MATIC...",
            "Note: Retourne le premier token trouvé avec ce ticker"
          ]} />
        </MethodAccordion>
      </div>
    </div>
  );
}
