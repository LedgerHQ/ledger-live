import React from "react";
import type { UpdateOfferSheetsProps } from "./UpdateOfferSheets.types";
import { UpdateOfferSheetsView } from "./UpdateOfferSheetsView";
import { useUpdateOfferSheetsViewModel } from "./useUpdateOfferSheetsViewModel";

export function UpdateOfferSheets(props: UpdateOfferSheetsProps) {
  return <UpdateOfferSheetsView {...useUpdateOfferSheetsViewModel(props)} />;
}
