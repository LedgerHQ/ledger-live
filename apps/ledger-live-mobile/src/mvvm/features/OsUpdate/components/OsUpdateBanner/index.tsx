import React from "react";
import {
  OsUpdateBanner as OsUpdateBannerBlock,
  UpdateOnDesktopSheet,
} from "@features/flow-device-os-update/native";
import { useOsUpdateBannerViewModel } from "./useOsUpdateBannerViewModel";

export function OsUpdateBanner() {
  const { banner, updateOnDesktopSheet } = useOsUpdateBannerViewModel();

  return (
    <>
      <OsUpdateBannerBlock {...banner} />
      {updateOnDesktopSheet ? <UpdateOnDesktopSheet {...updateOnDesktopSheet} /> : null}
    </>
  );
}
