import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";

import { useLocation, useNavigate } from "react-router";
import { USBTroubleshootingIndexSelector } from "~/renderer/reducers/settings";
import { setUSBTroubleshootingIndex } from "~/renderer/actions/settings";
import { setTrackingSource } from "../analytics/TrackPage";
function useUSBTroubleshooting() {
  const lastLocation = useRef<string | null>(null);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const USBTroubleshootingIndex = useSelector(USBTroubleshootingIndexSelector);
  useEffect(() => {
    if (!lastLocation.current) lastLocation.current = location.pathname;
    if (
      USBTroubleshootingIndex !== undefined &&
      USBTroubleshootingIndex !== null &&
      location.pathname !== "/USBTroubleshooting"
    ) {
      if (lastLocation.current === "/USBTroubleshooting") {
        lastLocation.current = location.pathname;
        // We are navigating away from the troubleshooting
        dispatch(setUSBTroubleshootingIndex());
      } else {
        setTrackingSource("USBTroubleshooting");
        lastLocation.current = "/USBTroubleshooting";
        navigate("/USBTroubleshooting", {
          state: {
            USBTroubleshootingIndex,
          },
        });
      }
    } else {
      lastLocation.current = location.pathname;
    }
  }, [USBTroubleshootingIndex, dispatch, navigate, location.pathname]);
}
export default useUSBTroubleshooting;
