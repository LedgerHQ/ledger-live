import { DeeplinkHandler } from "../types";

export const earnHandler: DeeplinkHandler<"earn"> = (route, { navigate }) => {
  const { path, cryptoAssetId, accountId, search } = route;

  if (path === "deposit") {
    navigate(
      "/earn",
      {
        intent: "deposit",
        cryptoAssetId: cryptoAssetId ?? "",
        accountId: accountId ?? "",
      },
      search,
    );
  } else {
    navigate("/earn", undefined, search);
  }
};
