import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { CountervaluesMarketcap, useMarketcapIds } from "@ledgerhq/live-countervalues-react";
import { findCryptoCurrencyById, findTokenById } from "@ledgerhq/coin-framework/currencies/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const getStaticProps = async () => ({ props: {} });

const Main = styled.div`
  padding-bottom: 100px;
  margin: 20px auto;
  max-width: 600px;

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    th {
      text-align: left;
    }
    tr.unknown {
      color: #f00;
    }
    td {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    td.id {
      width: 200px;
    }
  }
`;

const Item = ({
  id,
  i,
  currency,
}: {
  id: string;
  i: number;
  currency: TokenCurrency | CryptoCurrency | null | undefined;
}) => {
  return (
    <tr className={"item" + (currency ? "" : " unknown")}>
      <td className="rank">{i + 1}</td>
      <td className="id" title={id}>
        {id.slice(0, 40)}
      </td>
      <td className="name">{currency ? currency.name : "❌ Not Found"}</td>
    </tr>
  );
};

const App = () => {
  const [onlyKnown, setOnlyKnown] = useState(false);
  const ids = useMarketcapIds();
  const coins = useMemo(() => {
    const list: Array<[string, TokenCurrency | CryptoCurrency | null | undefined]> = ids.map(id => [
      id,
      findCryptoCurrencyById(id) || findTokenById(id),
    ]);
    if (onlyKnown) {
      return list.filter(([_, currency]) => currency);
    }
    return list;
  }, [ids, onlyKnown]);

  return (
    <Main>
      <label htmlFor="onlyknown">
        <input
          type="checkbox"
          id="onlyknown"
          checked={onlyKnown}
          onChange={() => setOnlyKnown(!onlyKnown)}
        />
        Only known
      </label>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>id</th>
            <th>name</th>
          </tr>
        </thead>
        <tbody>
          {coins.map(([id, currency], i) => (
            <Item key={id} currency={currency} id={id} i={i} />
          ))}
        </tbody>
      </table>
    </Main>
  );
};

const Page = () => {
  return (
    <CountervaluesMarketcap>
      <App />
    </CountervaluesMarketcap>
  );
};

export default Page;
