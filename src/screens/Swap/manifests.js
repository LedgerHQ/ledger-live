// @flow
import { useMemo } from "react";

// TODO: use proper manifests instead of static one here
const useManifests = () =>
  useMemo(() => {
    const paraswapUrl = new URL(
      `https://ledger-live-platform-apps.vercel.app/app/dapp-browser`,
    );
    paraswapUrl.searchParams.set(
      "url",
      "https://paraswap.io/?embed=true&referrer=ledger",
    );
    paraswapUrl.searchParams.set("nanoApp", "Paraswap");
    paraswapUrl.searchParams.set("dappName", "paraswap");

    const manifests = {
      debug: {
        url: new URL(`https://ledger-live-platform-apps.vercel.app/app/debug`),
        name: "Debugger",
      },
      paraswap: {
        name: "ParaSwap",
        url: paraswapUrl,
      },
    };

    return manifests;
  }, []);

export default useManifests;
