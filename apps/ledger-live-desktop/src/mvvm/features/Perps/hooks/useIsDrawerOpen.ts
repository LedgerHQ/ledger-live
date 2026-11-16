import { useContext } from "react";
import { context as drawerContext } from "~/renderer/drawers/Provider";

export function useIsDrawerOpen(): boolean {
  return useContext(drawerContext).state.open;
}
