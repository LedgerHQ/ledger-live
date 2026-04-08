import { ScreenName } from "~/const";
import type { MrzData } from "LLM/features/PassportAttestation/utils/mrzParser";
import type { PassportData } from "LLM/features/PassportAttestation/utils/passportReader";
import type { AgeProof } from "LLM/features/PassportAttestation/utils/zkProof";

export type PassportAttestationNavigatorStackParamList = {
  [ScreenName.PassportAttestationScanMRZ]: undefined;
  [ScreenName.PassportAttestationReadNFC]: {
    mrzData: MrzData;
  };
  [ScreenName.PassportAttestationConfirm]: {
    mrzData: MrzData;
  };
  [ScreenName.PassportAttestationGenerateProof]: {
    mrzData: MrzData;
    passportData: PassportData;
  };
  [ScreenName.PassportAttestationSuccess]: {
    proof: AgeProof;
  };
};
