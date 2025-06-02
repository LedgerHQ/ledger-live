import React, { useCallback, useEffect, useState } from "react";
import invariant from "invariant";
import {
  Checkbox,
  Flex,
  InfiniteLoader,
  // Progress,
  Text,
  Button,
  Box,
} from "@ledgerhq/react-ui";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Subject, Subscription } from "rxjs";

import TrackPage from "~/renderer/analytics/TrackPage";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";
import { VirtualList } from "@ledgerhq/react-ui/pre-ldls/index";

type Account = {
  id: string;
  name: string;
  address: string;
  balance: string;
  ticker: string;
};

interface Props {
  currency: CryptoOrTokenCurrency;
  onComplete: (selected: Account[]) => void;
}

const ScanAccounts = ({ currency, onComplete }: Props) => {
  invariant(currency, "ScanAccounts: currency is required");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isScanning, setScanning] = useState(true);

  /* ------------------------------------------------------------------ */
  /*  Scan stream — swap with your real `scanAccountsFromDevice(...)`    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const stream = new Subject<Account>();
    const sub: Subscription = stream.subscribe(acc => setAccounts(prev => [...prev, acc]));

    // 🔧 mock data
    setTimeout(
      () =>
        stream.next({
          id: "1",
          name: "ETH 1",
          address: "0x123…1",
          balance: "0.12",
          ticker: "ETH",
        }),
      400,
    );
    setTimeout(
      () =>
        stream.next({
          id: "2",
          name: "ETH 2",
          address: "0x123…2",
          balance: "7.50",
          ticker: "ETH",
        }),
      800,
    );
    setTimeout(() => {
      stream.complete();
      setScanning(false);
    }, 1200);

    return () => sub.unsubscribe();
  }, [currency]);
  /* ------------------------------------------------------------------ */

  const toggle = useCallback((id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const stop = useCallback(() => setScanning(false), []);

  const confirm = useCallback(
    () => onComplete(accounts.filter(a => checkedIds.has(a.id))),
    [accounts, checkedIds, onComplete],
  );

  const currencyName =
    currency.type === "TokenCurrency" ? currency.parentCurrency.name : currency.name;

  /* ------------------------- render helpers ------------------------- */
  const renderAccount = (acc: Account) => (
    <Flex
      key={acc.id}
      flex={1}
      px={6}
      py={3}
      alignItems="center"
      borderBottom="1px solid"
      borderColor="neutral.c30"
    >
      <Box mr={4} flex={1}>
        <Box>
          <Text variant="paragraph" fontWeight="medium">
            {acc.name}
          </Text>
        </Box>
        <Box>
          <Text variant="small" color="neutral.c70">
            {acc.address}
          </Text>
        </Box>
      </Box>

      <Flex mr={5}>
        <Text variant="paragraph">
          {acc.balance} {acc.ticker}
        </Text>
      </Flex>

      <Checkbox
        // size="S"
        name={acc.id}
        isChecked={checkedIds.has(acc.id)}
        onChange={() => toggle(acc.id)}
      />
    </Flex>
  );

  return (
    <>
      <TrackPage
        category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY}
        name="ScanAccounts"
        currencyName={currencyName}
      />

      <Text variant="h4Inter" fontWeight="semiBold" mb={4}>
        {isScanning
          ? "Scanning accounts…"
          : // TODO should use i18n variables for plurals
            accounts.length === 0
            ? "No accounts were found"
            : `We found ${accounts.length} account${accounts.length > 1 ? "s" : ""}`}
      </Text>

      {/* {isScanning && <Progress indeterminate mb={2} />} */}

      <VirtualList
        items={accounts}
        itemHeight={72}
        renderItem={renderAccount}
        hasNextPage={false}
        onVisibleItemsScrollEnd={() => {}}
      />

      {isScanning && accounts.length === 0 && (
        <Flex alignItems="center" mt={6}>
          <InfiniteLoader />
        </Flex>
      )}

      <Flex mt={6} justifyContent="flex-end" columnGap={3}>
        <Button
          // variant="secondary"
          disabled={!isScanning}
          onClick={stop}
        >
          Stop scanning
        </Button>
        <Button
          // primary
          disabled={checkedIds.size === 0}
          onClick={confirm}
          data-test-id="scan-accounts-confirm"
        >
          Confirm
        </Button>
      </Flex>
    </>
  );
};

export default ScanAccounts;
