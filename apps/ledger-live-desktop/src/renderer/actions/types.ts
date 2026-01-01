import { ThunkAction } from "@reduxjs/toolkit";
import { UnknownAction } from "redux";
import { State } from "~/renderer/reducers";

export type ThunkResult<R = void> = ThunkAction<R, State, unknown, UnknownAction>;
