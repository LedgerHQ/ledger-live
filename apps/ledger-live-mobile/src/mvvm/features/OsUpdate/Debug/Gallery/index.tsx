import React from "react";
import { WithOsUpdatePorts } from "../../ports/WithOsUpdatePorts";
import { OsUpdateGalleryView } from "./OsUpdateGalleryView";
import { useOsUpdateGalleryViewModel } from "./useOsUpdateGalleryViewModel";

function OsUpdateGalleryContent() {
  return <OsUpdateGalleryView {...useOsUpdateGalleryViewModel()} />;
}

export default function OsUpdateGallery() {
  return (
    <WithOsUpdatePorts>
      <OsUpdateGalleryContent />
    </WithOsUpdatePorts>
  );
}
