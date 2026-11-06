import React from "react";
import { OsUpdateGalleryView } from "./OsUpdateGalleryView";
import { useOsUpdateGalleryViewModel } from "./useOsUpdateGalleryViewModel";

export default function OsUpdateGallery() {
  return <OsUpdateGalleryView {...useOsUpdateGalleryViewModel()} />;
}
