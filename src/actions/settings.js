// @flow

import type { Dispatch } from "redux";
import db from "../db";
import type { CurrencySettings } from "../reducers/settings";

type Settings = {};

export type SaveSettings = Settings => (Dispatch<*>) => void;

export const saveSettings: SaveSettings = payload => dispatch => {
  dispatch({
    type: "DB:SAVE_SETTINGS",
    payload
  });
};

type InitSettings = () => (Dispatch<*>) => Promise<void>;

export const initSettings: InitSettings = () => async dispatch => {
  const settings = (await db.get("settings")) || {};
  if (Object.keys(settings).length === 0) {
    return;
  }
  dispatch({
    type: "FETCH_SETTINGS",
    payload: settings
  });
};

export const updateCurrencySettings = (
  coinType: number,
  patch: $Shape<CurrencySettings>
) => ({
  type: "DB:UPDATE_CURRENCY_SETTINGS",
  coinType,
  patch
});
