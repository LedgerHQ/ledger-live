// @flow
import { BigNumber } from "bignumber.js";
import React, { useMemo, useEffect, useState, memo } from "react";
import { genAccount as makeMockAccount } from "@ledgerhq/live-common/lib/mock/account";
import { shortAddressPreview, decodeAccountId } from "@ledgerhq/live-common/lib/account";
import type { Account, Currency } from "@ledgerhq/live-common/lib/types";
import type { StepProps } from "..";
import { getDerivationScheme, runDerivationScheme } from "@ledgerhq/live-common/lib/derivation";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";

const makeAccount = (address: string, currency: Currency): Account => {
  const id = `js:1:${currency.id}:${address}:`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);
  const scheme = getDerivationScheme({
    derivationMode,
    currency,
  });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });

  const account: Account = {
    type: "Account",
    name:
      currency.name + " " + (derivationMode || "legacy") + " " + shortAddressPreview(xpubOrAddress),
    xpub: xpubOrAddress,
    seedIdentifier: xpubOrAddress,
    starred: true,
    used: true,
    swapHistory: [],
    id,
    derivationMode,
    currency,
    unit: currency.units[0],
    index,
    freshAddress: xpubOrAddress,
    freshAddressPath,
    freshAddresses: [],
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: {
        latestDate: null,
        balances: [],
      },
      DAY: {
        latestDate: null,
        balances: [],
      },
      WEEK: {
        latestDate: null,
        balances: [],
      },
    },
  };

  return account;
};

const StepImport = ({ currency, setAccountToAdd, setAccountName }: StepProps) => {
  const mainCurrency = currency.type === "TokenCurrency" ? currency.parentCurrency : currency;
  const [address, setAddress] = useState("");
  const [addressName, setAddressName] = useState("");

  const account = useMemo(
    () =>
      address
        ? makeAccount(address, mainCurrency)
        : makeMockAccount(Math.random(), { currency: mainCurrency }),
    [address, mainCurrency],
  );

  useEffect(() => {
    setAccountToAdd(account);
    setAccountName(account, addressName);
  }, [account, setAccountToAdd, addressName, setAccountName]);

  if (!currency) return null;

  return (
    <>
      <Box mt={-4}>
        <label>Address</label>
        <Input type="text" value={address} onChange={value => setAddress(value)} />
        <label>Address Name</label>
        <Input type="text" value={addressName} onChange={value => setAddressName(value)} />
      </Box>
    </>
  );
};

export default memo<StepProps>(StepImport);

export const StepImportFooter = ({ transitionTo, onClickAdd, onCloseModal, t }: StepProps) => {
  return (
    <>
      <Button
        onClick={async () => {
          await onClickAdd();
          transitionTo("finish");
        }}
      >
        Add le compte gros
      </Button>
    </>
  );
};
