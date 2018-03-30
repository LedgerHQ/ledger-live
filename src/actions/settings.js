// @flow

import type { Dispatch } from "redux";
import db from "../db";

type Settings = *;

export type SaveSettings = Settings => { type: string, payload: Settings };

export const saveSettings: SaveSettings = payload => ({
  type: "DB:SAVE_SETTINGS",
  payload
});

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

export const updateSettings = payload => dispatch => {
  dispatch({
    type: "SAVE_SETTINGS",
    payload
  });
};
