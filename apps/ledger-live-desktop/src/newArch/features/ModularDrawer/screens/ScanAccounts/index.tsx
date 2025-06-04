import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { Box, Button, Checkbox, CryptoIcon, Flex, InfiniteLoader, Text } from "@ledgerhq/react-ui";
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

interface FormattedAccount extends Pick<Account, "currency" | "id"> {
  address: string;
  balance: string;
  name: string;
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

  const formattedAccounts = useMemo(
    () =>
      scannedAccounts.map(
        (account): FormattedAccount => ({
          id: account.id,
          currency: account.currency,
          // TODO review freshAddress
          address: formatAddress(account.freshAddress),
          balance: account.balance.toString(),
          name: accountNameWithDefaultSelector(walletState, account),
        }),
      ),
    [scannedAccounts, walletState],
  );

  const renderAccount = (x: FormattedAccount) => (
    <Flex
      key={x.id}
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
            {x.name}
          </Text>
        </Box>
        <Flex>
          <Text
            display="block"
            variant="small"
            color="neutral.c70"
            // TODO cannot use text-overflow since it doesn't support middle ellipsis
            textOverflow="ellipsis"
            maxWidth="79px"
            overflow="hidden"
          >
            {x.address}
          </Text>
          <CryptoIcon name={x.currency.ticker} circleIcon />
        </Flex>
      </Box>

      <Flex mr={5}>
        <Text variant="paragraph">
          {x.balance} {x.currency.ticker}
        </Text>
      </Flex>

      <Checkbox
        // size="S"
        name={x.id}
        isChecked={checkedIds.has(x.id)}
        onChange={() => toggle(x.id)}
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

      <VirtualList
        items={formattedAccounts}
        itemHeight={72}
        renderItem={renderAccount}
        hasNextPage={false}
        onVisibleItemsScrollEnd={() => {}}
      />

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
