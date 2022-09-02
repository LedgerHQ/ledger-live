/* eslint-disable no-console */
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AccountData } from "@ledgerhq/live-common/cross";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";

import { Account } from "@ledgerhq/types-live";

// @ts-expect-error This import is hardcoded in the metro config
// eslint-disable-next-line import/no-unresolved
import appJson from "__app_json__";

import {
  importAccountsMakeItems,
  syncNewAccountsToImport,
} from "@ledgerhq/live-common/account/index";
import { bridgeCache } from "../bridge/cache";
import { importAccounts, importStore } from "../actions/accounts";

let importedOnce = !__DEV__ || !appJson;

export default function MockAppJson({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const dispatch = useDispatch();
  const [loadingText, setLoadingText] = useState<string | undefined>();

  useEffect(() => {
    // Prevent importing app.json more than once in the whole lifecycle of the app.
    if (!importedOnce) {
      (async () => {
        try {
          setLoadingText("Clearing accounts");
          const accounts: Account[] = [];
          dispatch(importStore({ active: accounts }));
          setLoadingText("Preparing imports");
          const accountsData: { data: AccountData }[] = appJson.data.accounts;
          const newAccounts: AccountData[] = accountsData.map(
            account => account.data,
          );
          const result = {
            ...appJson.data,
            accounts: newAccounts,
          };
          const items = await importAccountsMakeItems({
            result,
            accounts,
          });
          setLoadingText("Syncing accounts");
          const selectedAccounts = newAccounts.map(a => a.id);
          const syncResult = await syncNewAccountsToImport(
            { items, selectedAccounts },
            bridgeCache,
          );
          setLoadingText("Importing accounts");
          dispatch(importAccounts({ items, selectedAccounts, syncResult }));
          console.log("Mocked app.json successfully");
        } catch (e) {
          console.error("Error while trying to mock app.json accounts.");
          console.error(e);
        }
        importedOnce = true;
        setLoadingText(undefined);
      })();
    }
  }, [dispatch]);

  if (importedOnce) {
    return <>{children}</>;
  }
  return (
    <Flex
      bg="constant.black"
      flex={1}
      alignItems="center"
      justifyContent="center"
    >
      <Text variant="h1" color="constant.white" mb={4}>
        Mocking app.json
      </Text>
      {loadingText && (
        <Text variant="h3" color="constant.white" mb={12}>
          {loadingText}…
        </Text>
      )}
      <InfiniteLoader size={60} color="constant.white" />
    </Flex>
  );
}
