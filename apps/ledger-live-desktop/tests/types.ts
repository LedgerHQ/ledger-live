import React from "react";
import userEvent from "@testing-library/user-event";
import { type State } from "~/renderer/reducers";
import createStore from "../src/renderer/createStore";

export interface ExtraOptions {
  initialState?: Partial<State>;
  initialRoute?: string;
  store?: ReturnType<typeof createStore>;
  userEventOptions?: Parameters<typeof userEvent.setup>[0];
  minimal?: boolean;
  [key: string]: unknown;
}

export interface RenderReturn {
  store: ReturnType<typeof createStore>;
  user: ReturnType<typeof userEvent.setup>;
}

export interface ProvidersProps {
  children: React.ReactNode;
  store: ReturnType<typeof createStore>;
  minimal?: boolean;
}
