import React from "react";
import { useTranslation } from "react-i18next";
import { Account, AccountLike } from "@ledgerhq/types-live";
import Text from "~/renderer/components/Text";

type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
  transaction: string;
};

const ConfirmTitle = (_props: Props) => {
  const { t } = useTranslation();

  return (
    <Text ff={"Inter|Medium"} textAlign={"center"} fontSize={22} marginBottom={12}>
      {t("sign.description")}
    </Text>
  );
};

export default ConfirmTitle;
