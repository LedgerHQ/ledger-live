import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { Box, Flex } from "@ledgerhq/react-ui";
import { Checkbox, Button, InfiniteLoader, Text } from "@ledgerhq/react-ui";
import {
  AccountItem,
  Account as AccountItemAccount,
} from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { VirtualList } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { BehaviorSubject } from "rxjs";
import * as RX from "rxjs/operators";
import TrackPage from "~/renderer/analytics/TrackPage";
import { walletSelector } from "~/renderer/reducers/wallet";
import { Title } from "../../components/Header/Title";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";
import { formatAddress } from "~/newArch/utils/formatAddress";

interface Props {
  currency: CryptoCurrency;
  deviceId: string;
  onComplete: (selected: Account[]) => void;
}

const ScanAccounts = ({ currency, onComplete, deviceId }: Props) => {
  invariant(currency, "ScanAccounts: currency is required");

  const walletState = useSelector(walletSelector);

  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const [isScanning, setIsScanning] = useState(true);
  const [isScanning$] = useState(() => new BehaviorSubject(isScanning));
  useEffect(() => {
    const subscription = isScanning$.subscribe(setIsScanning);
    return () => subscription.unsubscribe();
  }, [isScanning$]);

  useEffect(() => {
    const bridge = getCurrencyBridge(currency);

    const seenIds = new Set<string>();

    const subcription = bridge
      .scanAccounts({
        currency,
        deviceId,
        syncConfig: {
          paginationConfig: {},
        },
      })
      .pipe(
        RX.takeUntil(isScanning$.pipe(RX.filter(x => !x))),
        RX.filter(x => x.type === "discovered"),
        RX.map(x => x.account),
        RX.tap(x => console.log("SCAN ACCOUNT EVENT", { x })),
      )
      .subscribe({
        next: x => {
          if (seenIds.has(x.id)) {
            return;
          }
          seenIds.add(x.id);
          setScannedAccounts(prev => [...prev, x]);
        },
        complete: () => isScanning$.next(false),
        error: () => isScanning$.next(false), // TODO could surface the error UI-wise
      });
    return () => {
      setScannedAccounts([]);
      subcription.unsubscribe();
    };
  }, [currency, deviceId, isScanning$]);

  // TODO review
  const toggle = useCallback((id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleConfirm = useCallback(
    () => onComplete(scannedAccounts.filter(a => checkedIds.has(a.id))),
    [scannedAccounts, checkedIds, onComplete],
  );

  const currencyName = currency.name;

  // const formattedAccounts = useMemo(
  //   () =>
  //     scannedAccounts.map(
  //       (account): AccountItemAccount => ({
  //         id: account.id,
  //         currency: account.currency,
  //         // TODO review freshAddress
  //         address: formatAddress(account.freshAddress),
  //         balance: account.balance.toString(),
  //         name: accountNameWithDefaultSelector(walletState, account),
  //       }),
  //     ),
  //   [scannedAccounts, walletState],
  // );
  const formattedAccounts = [
    {
      address: formatAddress("utfdg9023lle21easd13x"),
      balance: "23320.00",
      fiatValue: "$23320.00",
      ticker: "ETH",
      protocol: "1111",
      parentId: "ethereum",
      id: "0",
      name: "XLA",
    },
    {
      address: formatAddress("asdasf12easdasds3k4"),
      balance: "320.00",
      fiatValue: "$19009.00",
      parentId: "bitcoin",
      cryptoId: "bitcoin",
      ticker: "BTC",
      id: "1",
      name: "XLA",
    },
  ] satisfies AccountItemAccount[];

  // TODO review whether to extract into a component following NetworkItem
  const renderAccount = (x: AccountItemAccount) => (
    <AccountItem
      account={x}
      onClick={() => {}}
      checkbox={{ name: "checked", isChecked: checkedIds.has(x.id), onChange: () => toggle(x.id) }}
    />
  );

  //   <Flex
  //   key={x.id}
  //   flex={1}
  //   borderRadius={12}
  //   // TODO 16px
  //   px={3}
  //   py={3}
  //   alignItems="center"
  //   backgroundColor="neutral.c30"
  // >
  //   <Box mr={4} flex={1}>
  //     <Box>
  //       <Text variant="paragraph" fontWeight="medium">
  //         {x.name}
  //       </Text>
  //     </Box>
  //     <Flex columnGap={1}>
  //       <Text color="neutral.c70" display="block" variant="small">
  //         {x.address}
  //       </Text>
  //       {/* TODO 20px in Figma */}
  //       <CryptoIcon ledgerId={x.currency.id} ticker={x.currency.ticker} size="24px" />
  //     </Flex>
  //   </Box>

  //   <Flex mr={5}>
  //     <Text variant="paragraph">
  //       {x.balance} {x.currency.ticker}
  //     </Text>
  //   </Flex>

  //   <Checkbox
  //     // size="S"
  //     name={x.id}
  //     isChecked={checkedIds.has(x.id)}
  //     onChange={() => toggle(x.id)}
  //   />
  // </Flex>

  return (
    <>
      <TrackPage
        category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY}
        name="ScanAccounts"
        currencyName={currencyName}
      />
      <Title translationKey="modularAssetDrawer.scanAccounts" />

      <Text variant="h4Inter" fontWeight="semiBold" mb={4}>
        {isScanning
          ? "Scanning accounts…"
          : // TODO should use i18n variables for plurals
            scannedAccounts.length === 0
            ? "No accounts were found"
            : `We found ${scannedAccounts.length} account${scannedAccounts.length > 1 ? "s" : ""}`}
      </Text>

      {/* {isScanning && <Progress indeterminate mb={2} />} */}

      <Box flex={1}>
        {/* TODO review whether to extract into a component following NetworkList */}
        <VirtualList
          gap={16}
          items={formattedAccounts}
          itemHeight={72}
          renderItem={renderAccount}
          hasNextPage={false}
          onVisibleItemsScrollEnd={() => {}}
        />
      </Box>

      {isScanning && formattedAccounts.length === 0 && (
        <Flex alignItems="center" mt={6}>
          <InfiniteLoader />
        </Flex>
      )}

      <Flex mt={6} justifyContent="flex-end" columnGap={3}>
        {isScanning ? (
          <Button onClick={() => isScanning$.next(false)}>Stop scanning</Button>
        ) : (
          <Button disabled={checkedIds.size === 0} onClick={handleConfirm}>
            Confirm
          </Button>
        )}
      </Flex>
    </>
  );
};

export default ScanAccounts;
