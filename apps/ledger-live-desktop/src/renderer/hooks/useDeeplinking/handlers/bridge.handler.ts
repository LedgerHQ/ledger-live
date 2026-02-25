import { closeAllModal, openModal } from "~/renderer/actions/modals";
import { DeeplinkHandler } from "../types";

export const bridgeHandler: DeeplinkHandler<"bridge"> = (route, { dispatch }) => {
  const { origin, appName } = route;

  dispatch(closeAllModal());
  dispatch(
    openModal("MODAL_WEBSOCKET_BRIDGE", {
      origin,
      appName,
    }),
  );
};
