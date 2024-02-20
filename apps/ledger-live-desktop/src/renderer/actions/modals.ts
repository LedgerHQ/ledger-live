import { createAction } from "redux-actions";
import { ModalData } from "~/renderer/modals/types";

function openModalF<Name extends keyof ModalData>(name: Name, data: ModalData[Name]) {
  return { name, data };
}

export type OpenModal = typeof openModalF;

export const openModal = createAction("MODAL_OPEN", openModalF);

export const closeModal = createAction(
  "MODAL_CLOSE",
  (
    name: keyof ModalData,
  ): {
    name: keyof ModalData;
  } => ({
    name,
  }),
);

export const closeAllModal = createAction("MODAL_CLOSE_ALL");

export const setDataModal = createAction("MODAL_SET_DATA", openModalF);
