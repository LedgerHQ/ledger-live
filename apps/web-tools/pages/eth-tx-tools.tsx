import React, { useState } from "react";
import { ledgerService } from "@ledgerhq/hw-app-eth";

type LedgerEthTransactionResolution = Awaited<ReturnType<typeof ledgerService.resolveTransaction>>;

export const getStaticProps = async () => ({ props: {} });

function App() {
  const [unsignedTxHex, setUnsignedTxHex] = useState("");
  const [result, setResult] = useState<LedgerEthTransactionResolution | null>(null);

  const resolveTransaction = async (unsignedTxHex: string) => {
    const result = await ledgerService.resolveTransaction(
      unsignedTxHex,
      {},
      {
        nft: true,
        erc20: true,
        externalPlugins: true,
      },
    );
    setResult(result);
  };

  return (
    <div>
      <label>
        Unsigned Transaction Hex:
        <input type="text" value={unsignedTxHex} onChange={e => setUnsignedTxHex(e.target.value)} />
      </label>
      <button onClick={() => resolveTransaction(unsignedTxHex)}>Resolve Transaction</button>
      {result && (
        <pre>
          <code>{JSON.stringify(result, null, 2)}</code>
        </pre>
      )}
    </div>
  );
}

export default App;
