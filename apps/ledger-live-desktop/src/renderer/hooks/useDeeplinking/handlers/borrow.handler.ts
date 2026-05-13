import { DeeplinkHandler } from "../types";

export const borrowHandler: DeeplinkHandler<"borrow"> = (route, { navigate }) => {
  const { search } = route;
  navigate("/borrow", undefined, search);
};
