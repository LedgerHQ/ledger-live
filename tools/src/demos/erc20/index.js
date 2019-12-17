// @flow
import React, { useState, useEffect } from "react";
import { BigNumber } from "bignumber.js";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import styled from "styled-components";
import { apiForCurrency } from "@ledgerhq/live-common/lib/api/Ethereum";
import signERC20Transaction from "@ledgerhq/live-common/lib/hw/signTransaction/erc20";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import type { CurrencyToken } from "@ledgerhq/live-common/lib/types";

import AccountField from "./AccountField";
import TokenSelect from "./TokenSelect";
import AmountField from "./AmountField";
import AddressField from "./AddressField";
import GasLimitField from "./GasLimitField";
import SendButton from "./SendButton";

const ErrorMsg = styled.div`
  color: red;
`;

const Preview = styled.div`
  color: #666;
  font-family: monospace;
  font-size: 10px;
  word-break: break-all;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

// copy of ethereum with a custom API
const ethereum = {
  ...getCryptoCurrencyById("ethereum")
};
const api = apiForCurrency(ethereum);

const SendToken = ({ token }: { token: CurrencyToken }) => {
  const [derivationPath, setDerivationPath] = useState("44'/60'/0'/0/0");
  const [amount, setAmount] = useState(BigNumber(0));
  const [address, setAddress] = useState("");
  const [gasPrice, setGasPrice] = useState(BigNumber(2000000000));
  const [gasLimit, setGasLimit] = useState(BigNumber(21000));
  const [error, setError] = useState(null);
  const [signed, setSigned] = useState(null);

  useEffect(() => {
    api.estimateGasLimitForERC20(token.contractAddress).then(value => {
      setGasLimit(BigNumber(value));
    });
  }, [token]);

  const disabled = !address || !amount || amount.isZero();

  return (
    <>
      <AccountField value={derivationPath} onChange={setDerivationPath} />
      <AddressField autoFocus value={address} onChange={setAddress} />
      <AmountField unit={token.units[0]} value={amount} onChange={setAmount} />
      <AmountField
        unit={ethereum.units[1]}
        value={gasPrice}
        onChange={setGasPrice}
      />
      <GasLimitField value={gasLimit} onChange={setGasLimit} />
      {signed ? (
        <Footer>
          <Preview>{signed}</Preview>
          <SendButton
            title="Broadcast"
            onClick={() => {
              setError(null);
              api.broadcastTransaction(signed).then(r => {
                console.log(r);
              }, setError);
            }}
          />
        </Footer>
      ) : (
        <Footer>
          <ErrorMsg>
            {error ? String((error && error.message) || error) : ""}
          </ErrorMsg>
          <SendButton
            title="Sign"
            disabled={disabled}
            onClick={() => {
              setError(null);
              Promise.all([TransportU2F.create(), api.getAccountNonce(address)])
                .then(([t, nonce]) =>
                  signERC20Transaction(token, t, derivationPath, {
                    nonce,
                    recipient: address,
                    gasPrice: "0x" + gasPrice.toString(16),
                    gasLimit: "0x" + gasLimit.toString(16),
                    amount: "0x" + amount.toString(16)
                  })
                )
                .then(setSigned, setError);
            }}
          />
        </Footer>
      )}
    </>
  );
};

const Main = styled.div`
  margin: 40px auto;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  > * {
    margin-bottom: 40px;
  }
`;

const Demo = () => {
  const [token, setToken] = useState(null);

  return (
    <Main>
      <TokenSelect value={token} onChange={setToken} />
      {token ? <SendToken token={token} /> : null}
    </Main>
  );
};

Demo.demo = {
  title: "ERC20",
  url: "/erc20",
  hidden: true
};

export default Demo;
