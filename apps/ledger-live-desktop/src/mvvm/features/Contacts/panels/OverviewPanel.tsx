import React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  Tag,
} from "@ledgerhq/lumen-ui-react";
import { DatabaseLock, GroupUsers, Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactsWallet } from "~/renderer/contacts/types";
import type { ContactsSubView } from "../types";

type Props = {
  wallet: ContactsWallet;
  setSubView: (view: ContactsSubView) => void;
};

const OverviewPanel = ({ wallet, setSubView }: Props) => {
  const { t } = useTranslation();

  const addressCount = Object.values(wallet.contacts).reduce(
    (n, c) => n + c.entries.length,
    0,
  );
  const accountCount = Object.keys(wallet.accounts).length;

  return (
    <div className="flex flex-col gap-12 pt-16 pb-0 px-0 w-full">
      <Card onClick={() => setSubView("external")}>
        <CardHeader>
          <CardLeading>
            <GroupUsers size={20} />
            <CardContent>
              <CardContentTitle>{t("contacts.overview.external.title")}</CardContentTitle>
              <CardContentDescription>
                {t("contacts.overview.external.description")}
              </CardContentDescription>
            </CardContent>
          </CardLeading>
          <CardTrailing>
            <Tag
              appearance="gray"
              label={t("contacts.overview.external.count", { count: addressCount })}
            />
          </CardTrailing>
        </CardHeader>
      </Card>

      <Card onClick={() => setSubView("accounts")}>
        <CardHeader>
          <CardLeading>
            <Wallet size={20} />
            <CardContent>
              <CardContentTitle>{t("contacts.overview.accounts.title")}</CardContentTitle>
              <CardContentDescription>
                {t("contacts.overview.accounts.description")}
              </CardContentDescription>
            </CardContent>
          </CardLeading>
          <CardTrailing>
            <Tag
              appearance="gray"
              label={t("contacts.overview.accounts.count", { count: accountCount })}
            />
          </CardTrailing>
        </CardHeader>
      </Card>

      <Card onClick={() => setSubView("storage")}>
        <CardHeader>
          <CardLeading>
            <DatabaseLock size={20} />
            <CardContent>
              <CardContentTitle>{t("contacts.overview.storage.title")}</CardContentTitle>
              <CardContentDescription>
                {t("contacts.overview.storage.description")}
              </CardContentDescription>
            </CardContent>
          </CardLeading>
        </CardHeader>
      </Card>
    </div>
  );
};

export default OverviewPanel;
