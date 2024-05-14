import React, { useCallback, useState } from "react";
import { findCryptoCurrencyById, listCryptoCurrencies } from "@ledgerhq/cryptoassets";
import { getDerivationModesForCurrency, getDerivationScheme, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export const getStaticProps = async () => ({ props: {} });

const App = () => {
  const [accountIndex, setAccountIndex] = useState("ACCOUNT");
  const onAccountIndexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountIndex(e.target.value);
  }, []);
  const [addressIndex, setAddressIndex] = useState("ADDRESS");
  const onAddressIndexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressIndex(e.target.value);
  }, []);


  const [currencyId, setCurrencyId] = useState("");
  const [derivationsPerCurrency, setDerivationsPerCurrency] = useState<{currency: { name: string, id: string }, derivations: {name: string, path: string}[]}[]>([]);
  const onCurrencyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrencyId(e.target.value);
  }, []);
  const onSubmit = useCallback(() => {
    const currencies = !currencyId ? listCryptoCurrencies()  : [findCryptoCurrencyById(currencyId)];
    setDerivationsPerCurrency(currencies.map(currency => {
      if (!currency) {
        return {
          currency: { name: "Unknown", id: "Unknown" },
          derivations: []
        };
      }
      
      return {
        currency,
        derivations: getDerivationModesForCurrency(currency).map((derivationMode) => {
          const deriationScheme = getDerivationScheme({ currency, derivationMode });
          return {
            name: derivationMode,
            path: runDerivationScheme(deriationScheme, currency, { account: accountIndex, address: addressIndex}),
          };
        })
      }
    })); 
  }, [accountIndex, currencyId, addressIndex]);

  return (
    <>
      <div>
        <label>Account index</label>
        <br/>
        <input
          type="text"
          onChange={onAccountIndexChange}
          value={accountIndex}
          placeholder="Enter the account index"
        />
      </div>
      <div>
        <label>Address index</label>
        <br/>
        <input
          type="text"
          onChange={onAddressIndexChange}
          value={addressIndex}
          placeholder="Enter the address index"
        />
      </div>
      <div>
        <label>Currency Id</label>
        <br/>
        <input
          type="text"
          onChange={onCurrencyChange}
          value={currencyId}
          placeholder="Enter the currency id"
        />
      </div>
      <br/>
      <div>
        <button onClick={onSubmit}>Get derivation paths</button>
      </div>
      {
        derivationsPerCurrency.map(({ currency, derivations }) => (
          <div key={currency.id}>
            <h4>{currency.id}</h4>
            <ul>
              {
                derivations.map(({ name, path }) => (
                  <li key={name}>
                    <li>{name || "Default"}: {path}</li>
                  </li>
                ))
              }
            </ul>
          </div>
        ))
      }
    </>
  );
};

export default App;
