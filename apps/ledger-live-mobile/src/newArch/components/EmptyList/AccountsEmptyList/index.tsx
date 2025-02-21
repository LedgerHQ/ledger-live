import React, { useState } from "react";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { urls } from "~/utils/urls";
import EmptyList from "../components";
import { track } from "~/analytics";

type Props = {
  sourceScreenName: string;
};

const AccountsEmptyList = ({ sourceScreenName }: Props) => {
  const [isAddModalOpened, setIsAddModalOpened] = useState<boolean>(false);

  const openAddModal = () => {
    track("button_clicked", { button: "Add a new account", page: sourceScreenName });
    setIsAddModalOpened(true);
  };
  const closeAddModal = () => setIsAddModalOpened(false);

  return (
    <>
      <EmptyList
        titleKey="emptyList.accounts.title"
        subTitleKey="emptyList.accounts.subTitle"
        buttonTextKey="emptyList.accounts.cta"
        onButtonPress={openAddModal}
        linkTextKey="emptyList.accounts.link"
        urlLink={urls.addAccount}
      />
      <AddAccountDrawer isOpened={isAddModalOpened} onClose={closeAddModal} />
    </>
  );
};

export default AccountsEmptyList;
