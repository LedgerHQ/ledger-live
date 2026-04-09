import React, { useCallback, useState } from "react";
import { TextInput } from "@ledgerhq/lumen-ui-react";
import { Actionable } from "./Actionable";
import {
  listSupportedCurrencies,
  setSupportedCurrencies,
} from "@ledgerhq/ledger-wallet-framework/currencies/support";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";

function asCryptoCurrencyId(id: string): CryptoCurrencyId {
  return id as CryptoCurrencyId;
}

export function AppSetSupportedCurrencies() {
  const [value, setValue] = useState<string>(() =>
    listSupportedCurrencies()
      .map(c => c.id)
      .join(" "),
  );

  const action = useCallback((value: string) => {
    setSupportedCurrencies(
      value
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(asCryptoCurrencyId),
    );
  }, []);

  return (
    <Actionable buttonTitle="Set Supported Currencies" inputs={[value]} action={action}>
      <TextInput value={value} onChange={e => setValue(e.target.value)} className="flex-1" />
    </Actionable>
  );
}
