import { openModal } from "~/renderer/actions/modals";
import { DeeplinkHandler } from "../types";

export const bridgeHandler: DeeplinkHandler<"bridge"> = (route, { dispatch }) => {
  const { origin, appName } = route;

  dispatch(
    openModal("MODAL_WEBSOCKET_BRIDGE", {
      origin,
      appName,
    }),
  );
};
