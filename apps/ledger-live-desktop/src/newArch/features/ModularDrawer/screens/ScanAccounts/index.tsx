import * as Icons from "@ledgerhq/icons-ui/react";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { Box, Button, Flex, Text } from "@ledgerhq/react-ui";
import {
  AccountItem,
  Account as AccountItemAccount,
} from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { VirtualList } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import { default as React, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { BehaviorSubject } from "rxjs";
import * as RX from "rxjs/operators";
import { formatAddress } from "~/newArch/utils/formatAddress";
import TrackPage from "~/renderer/analytics/TrackPage";
import { walletSelector } from "~/renderer/reducers/wallet";
import { Title } from "../../components/Header/Title";
import { MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY } from "../../types";

interface Props {
  currency: CryptoCurrency;
  deviceId: string;
  onComplete: (_: Account[]) => void;
  onLoadingChange: (_: boolean) => void;
}

const ScanAccounts = ({ currency, deviceId, onComplete, onLoadingChange }: Props) => {
  invariant(currency, "ScanAccounts: currency is required");

  const { t } = useTranslation();

  const walletState = useSelector(walletSelector);

  const [scannedAccounts, setScannedAccounts] = useState<Account[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const [isScanning, setIsScanning] = useState(true);
  const [isScanning$] = useState(() => new BehaviorSubject(isScanning));
  useEffect(() => {
    const subscription = isScanning$.subscribe(x => {
      setIsScanning(x);
      onLoadingChange(x);
    });
    return () => subscription.unsubscribe();
  }, [isScanning$, onLoadingChange]);

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

  const currencyName = currency.name;

  const formattedAccounts = useMemo(
    () =>
      scannedAccounts.map(
        (account): AccountItemAccount => ({
          // TODO review freshAddress
          address: formatAddress(account.freshAddress),
          balance: account.balance.toString(),
          cryptoId: account.currency.id,
          fiatValue: account.balance.toString(),
          id: account.id,
          name: accountNameWithDefaultSelector(walletState, account),
          ticker: account.currency.ticker,
        }),
      ),
    [scannedAccounts, walletState],
  );
  // const formattedAccounts = useMemo(
  //   () =>
  //     [
  //       {
  //         address: formatAddress("utfdg9023lle21easd13x"),
  //         balance: "23320.00",
  //         fiatValue: "$23320.00",
  //         ticker: "ETH",
  //         protocol: "1111",
  //         parentId: "ethereum",
  //         id: "0",
  //         name: "XLA",
  //       },
  //       {
  //         address: formatAddress("asdasf12easdasds3k4"),
  //         balance: "320.00",
  //         fiatValue: "$19009.00",
  //         parentId: "bitcoin",
  //         cryptoId: "bitcoin",
  //         ticker: "BTC",
  //         id: "1",
  //         name: "XLA",
  //       },
  //     ] satisfies AccountItemAccount[],
  //   [],
  // );

  // TODO review
  const handleToggle = useCallback((id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    () => setCheckedIds(new Set(formattedAccounts.map(a => a.id))),
    [formattedAccounts],
  );

  const handleDeselectAll = useCallback(() => setCheckedIds(new Set()), []);

  const handleConfirm = useCallback(
    () => onComplete(scannedAccounts.filter(a => checkedIds.has(a.id))),
    [scannedAccounts, checkedIds, onComplete],
  );

  const renderAccount = (x: AccountItemAccount) => (
    <AccountItem
      account={x}
      checkbox={{
        name: "checked",
        isChecked: checkedIds.has(x.id),
        onChange: () => handleToggle(x.id),
      }}
    />
  );

  return (
    <>
      <TrackPage
        category={MODULAR_DRAWER_ADD_ACCOUNT_CATEGORY}
        name="ScanAccounts"
        currencyName={currencyName}
      />

      <Title
        translationKey={
          isScanning
            ? "modularAssetDrawer.scanAccounts.title"
            : "modularAssetDrawer.addAccounts.title"
        }
      />

      <Box flex={1}>
        <Flex alignItems="center" justifyContent="space-between">
          <Text variant="h5Inter" fontSize="small" fontWeight="regular">
            {t(
              isScanning
                ? "modularAssetDrawer.scanAccounts.status.scanning"
                : formattedAccounts.length === 0
                  ? "modularAssetDrawer.scanAccounts.status.noAccounts"
                  : "modularAssetDrawer.scanAccounts.status.foundAccounts",
              { count: formattedAccounts.length },
            )}
          </Text>
          {/* TODO unstyled button */}
          {formattedAccounts.length > 0 ? (
            formattedAccounts.length === checkedIds.size ? (
              <Button onClick={handleDeselectAll}>
                {t("modularAssetDrawer.addAccounts.controls.deselectAll")}
              </Button>
            ) : (
              <Button onClick={handleSelectAll}>
                {t("modularAssetDrawer.addAccounts.controls.selectAll")}
              </Button>
            )
          ) : null}
        </Flex>

        <VirtualList
          gap={16}
          items={formattedAccounts}
          itemHeight={72}
          renderItem={renderAccount}
          // TODO review
          hasNextPage={false}
          onVisibleItemsScrollEnd={() => {}}
        />
      </Box>

      {!isScanning && formattedAccounts.length > 0 ? (
        <Box flex={1}>
          <Flex alignItems="center" justifyContent="space-between">
            <Text variant="h5Inter" fontSize="small" fontWeight="regular">
              {t("modularAssetDrawer.addAccounts.newAccount")}
            </Text>
          </Flex>

          <VirtualList
            gap={16}
            items={formattedAccounts}
            itemHeight={72}
            renderItem={renderAccount}
            // TODO review
            hasNextPage={false}
            onVisibleItemsScrollEnd={() => {}}
          />
        </Box>
      ) : null}

      <Flex justifyContent="flex-end">
        {isScanning ? (
          <Button
            alignItems="center"
            flex={1}
            Icon={<Icons.Pause />}
            iconPosition="left"
            onClick={() => isScanning$.next(false)}
            size="xl"
            variant="main"
          >
            <Text color="neutral.c00" variant="body" fontSize={16} fontWeight="600">
              {t("modularAssetDrawer.scanAccounts.cta.stopScanning")}
            </Text>
          </Button>
        ) : (
          <Button
            alignItems="center"
            color="neutral.c100"
            disabled={checkedIds.size === 0}
            flex={1}
            onClick={handleConfirm}
            size="xl"
            variant="main"
          >
            <Text color="neutral.c00" variant="body" fontSize={16} fontWeight="600">
              {t("modularAssetDrawer.addAccounts.cta.confirm")}
            </Text>
          </Button>
        )}
      </Flex>
    </>
  );
};

export default ScanAccounts;
