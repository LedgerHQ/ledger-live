import React, { useCallback } from "react";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";
import type { MrzData } from "../../utils/mrzParser";
import CameraScannerScreen from "./CameraScannerScreen";
import { sanitizeMrzDataForConfirmation } from "./form";

type Props = BaseComposite<
  StackNavigatorProps<
    PassportAttestationNavigatorStackParamList,
    ScreenName.PassportAttestationScanMRZ
  >
>;

export default function ScanMRZScreen({ navigation }: Props) {
  const handleMrzFromCamera = useCallback(
    (data: MrzData) => {
      navigation.navigate(ScreenName.PassportAttestationConfirm, {
        mrzData: sanitizeMrzDataForConfirmation(data),
      });
    },
    [navigation],
  );

  return <CameraScannerScreen onMrzDetected={handleMrzFromCamera} />;
}
