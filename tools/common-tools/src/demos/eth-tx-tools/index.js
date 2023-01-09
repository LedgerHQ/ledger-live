import React, { useState } from "react";
import { ledgerService } from "@ledgerhq/hw-app-eth";

function App() {
  const [unsignedTxHex, setUnsignedTxHex] = useState("");
  const [result, setResult] = useState(null);

  const resolveTransaction = async (unsignedTxHex) => {
    const result = await ledgerService.resolveTransaction(
      unsignedTxHex,
      {},
      {
        nft: true,
        erc20: true,
        externalPlugins: true,
      }
    );
    setResult(result);
  };

  return (
    <div>
      <label>
        Unsigned Transaction Hex:
        <input
          type="text"
          value={unsignedTxHex}
          onChange={(e) => setUnsignedTxHex(e.target.value)}
        />
      </label>
      <button onClick={() => resolveTransaction(unsignedTxHex)}>
        Resolve Transaction
      </button>
      {result && (
        <pre>
          <code>{JSON.stringify(result, null, 2)}</code>
        </pre>
      )}
    </div>
  );
}

App.demo = {
  title: "ETH tx tools",
  url: "/eth-tx-tools",
};

export default App;
