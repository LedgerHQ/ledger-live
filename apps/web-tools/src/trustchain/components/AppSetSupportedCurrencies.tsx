import React, { useCallback, useState } from "react";
import { Actionable } from "./Actionable";
import { Input } from "./Input";
import {
  listSupportedCurrencies,
  setSupportedCurrencies,
} from "@ledgerhq/coin-framework/currencies/support";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";

function asCryptoCurrencyId(id: string): CryptoCurrencyId {
  return id as CryptoCurrencyId; // FIXME it's a missing feature in cryptoassets
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
      <Input value={value} onChange={e => setValue(e.target.value)} />
    </Actionable>
  );
}
