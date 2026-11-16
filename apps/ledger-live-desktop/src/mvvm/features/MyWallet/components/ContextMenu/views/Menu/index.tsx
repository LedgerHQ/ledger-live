import React from "react";
import { ContactsButton } from "LLD/features/Contacts";
import TopBar from "../../../TopBar";
import { ActionsList } from "../../../ActionsList";
import { MyLedger } from "../../../MyLedger";
import { Explore } from "../../../Explore";
import { ManageAgentsButton } from "../../../ManageAgentsButton";
import { useMenuViewModel } from "./useMenuViewModel";

export function MenuView() {
  const { onRecoverClick } = useMenuViewModel();

  return (
    <div className="flex flex-col gap-24">
      <TopBar />
      <div className="flex flex-col gap-12">
        <ActionsList onRecoverClick={onRecoverClick} />
        <div className="flex flex-col gap-12">
          <ContactsButton />
          <ManageAgentsButton />
          <MyLedger />
          <Explore />
        </div>
      </div>
    </div>
  );
}
