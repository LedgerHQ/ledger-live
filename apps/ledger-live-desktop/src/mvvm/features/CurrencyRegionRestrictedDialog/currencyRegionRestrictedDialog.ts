import {
  closeDialogWithData,
  openDialogWithData,
  selectDialogWithDataParams,
  selectIsDialogWithDataOpen,
} from "~/renderer/reducers/dialogsWithData";
import type { DialogWithDataId } from "~/renderer/reducers/dialogsWithData";
import type { State } from "~/renderer/reducers";

const DIALOG_ID = "CURRENCY_REGION_RESTRICTED" satisfies DialogWithDataId;

export const openCurrencyRegionRestrictedDialog = (currencyName: string) =>
  openDialogWithData({ id: DIALOG_ID, data: { currencyName } });

export const closeCurrencyRegionRestrictedDialog = () => closeDialogWithData(DIALOG_ID);

export const selectIsCurrencyRegionRestrictedDialogOpen = (state: Pick<State, "dialogsWithData">) =>
  selectIsDialogWithDataOpen(state, DIALOG_ID);

export const selectCurrencyRegionRestrictedDialogParams = (state: Pick<State, "dialogsWithData">) =>
  selectDialogWithDataParams(state, DIALOG_ID);
