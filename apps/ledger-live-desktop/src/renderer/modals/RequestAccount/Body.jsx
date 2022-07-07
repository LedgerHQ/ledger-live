// @flow

import React, { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/sortByMarketcap";
import { listSupportedCurrencies, listTokens } from "@ledgerhq/live-common/currencies/index";
import SelectAccountAndCurrency from "~/renderer/components/SelectAccountAndCurrency";
import type { Account, AccountLike } from "@ledgerhq/live-common/types/index";
import { closeModal } from "~/renderer/actions/modals";
import { ModalBody } from "~/renderer/components/Modal";
import { makeRe } from "@ledgerhq/live-common/platform/filters";

type Props = {|
  onClose: () => void,
  params: {
    currencies?: string[],
    allowAddAccount?: boolean,
    includeTokens?: boolean,
    onResult: (account: AccountLike, parentAccount?: Account | null) => void,
    onCancel: (reason: any) => void,
  },
|};

export default function Body({ onClose, params }: Props) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { allowAddAccount, currencies, includeTokens } = params;

  const selectAccount = useCallback(
    (account, parentAccount) => {
      params.onResult(account, parentAccount);
      dispatch(closeModal("MODAL_REQUEST_ACCOUNT"));
    },
    [params, dispatch],
  );

  const cryptoCurrencies = useMemo(() => {
    const allCurrencies = includeTokens
      ? [...listSupportedCurrencies(), ...listTokens()]
      : listSupportedCurrencies();

    const filterCurrencyRegexes = currencies ? currencies.map(filter => makeRe(filter)) : null;

    return currencies
      ? allCurrencies.filter(currency => {
          if (
            filterCurrencyRegexes &&
            !filterCurrencyRegexes.some(regex => currency.id.match(regex))
          ) {
            return false;
          }

          return true;
        })
      : allCurrencies;
  }, [currencies, includeTokens]);

  // sorting them by marketcap
  // $FlowFixMe - don't know why it fails
  const sortedCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);

  return (
    <ModalBody
      onClose={onClose}
      title={t("platform.flows.requestAccount.title")}
      noScroll={true}
      render={() => (
        <SelectAccountAndCurrency
          selectAccount={selectAccount}
          allowedCurrencies={currencies}
          allowAddAccount={allowAddAccount}
          allCurrencies={sortedCurrencies}
        />
      )}
    />
  );
}
