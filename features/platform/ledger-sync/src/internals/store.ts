import type { Store, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { KeyRingState } from "@domain/entity-key-ring";
import { useDispatch, useSelector, useStore } from "react-redux";

/** The app dispatch, which runs the key ring thunks. */
export const useLedgerSyncDispatch = useDispatch.withTypes<LedgerSyncDispatch>();

/** `useSelector` on the part of the app state this package reads. */
export const useLedgerSyncSelector = useSelector.withTypes<LedgerSyncRootState>();

/** `useStore` on the part of the app state this package reads. */
export const useLedgerSyncStore = useStore.withTypes<Store<LedgerSyncRootState>>();

/** The slices this package reads: both apps mount the key ring slice under `trustchain`. */
export type LedgerSyncRootState = Readonly<{ trustchain: KeyRingState }>;

/** A dispatch that takes plain actions and thunks, as the apps' store dispatch does. */
export type LedgerSyncDispatch = ThunkDispatch<LedgerSyncRootState, unknown, UnknownAction>;
