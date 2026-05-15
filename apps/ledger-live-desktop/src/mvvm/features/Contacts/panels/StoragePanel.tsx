import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import { Trash } from "@ledgerhq/lumen-ui-react/symbols";
import type { UseContacts } from "~/renderer/contacts/useContacts";

type Props = {
  contacts: UseContacts;
};

const StoragePanel = ({ contacts }: Props) => {
  const { t } = useTranslation();

  const isEmpty =
    Object.keys(contacts.wallet.contacts).length === 0 &&
    Object.keys(contacts.wallet.accounts).length === 0;

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-24 pt-16 pb-0 px-0 w-full">
      <Button
        appearance="red"
        size="sm"
        icon={Trash}
        isFull
        disabled={isEmpty}
        onClick={() => {
          void contacts.reset();
        }}
      >
        {t("contacts.sections.reset.button")}
      </Button>

      <div className="flex flex-1 min-h-0 flex-col gap-12 w-full">
        <Subheader>
          <SubheaderRow>
            <SubheaderTitle>{t("contacts.sections.storage.title")}</SubheaderTitle>
          </SubheaderRow>
        </Subheader>
        <pre className="flex-1 min-h-0 body-4 text-base bg-surface rounded-sm p-12 overflow-auto whitespace-pre-wrap break-all select-text w-full">
          {isEmpty ? t("contacts.empty") : JSON.stringify(contacts.wallet, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default StoragePanel;
