import React from "react";
import TopBar from "../../../TopBar";
import { ActionsList } from "../../../ActionsList";
import { MyLedger } from "../../../MyLedger";
import { Explore } from "../../../Explore";
import { useMenuViewModel } from "./useMenuViewModel";

export function MenuView() {
  const { onRecoverClick } = useMenuViewModel();

  return (
    <div className="flex flex-col gap-24">
      <TopBar />
      <ActionsList onRecoverClick={onRecoverClick} />
      <div className="flex flex-col gap-12">
        <MyLedger />
        <Explore />
      </div>
    </div>
  );
}
