import { ScreenName } from "~/const";
import type { MrzData } from "LLM/features/PassportAttestation/utils/mrzParser";
import type { PassportData } from "LLM/features/PassportAttestation/utils/passportReader";
import type { AgeProof } from "LLM/features/PassportAttestation/utils/zkProof";
import type { SelectedProof } from "LLM/features/PassportAttestation/screens/SelectProof/useLedgerProofEncryption";

export type PassportAttestationNavigatorStackParamList = {
  [ScreenName.PassportAttestationLanding]: undefined;
  [ScreenName.PassportAttestationScanMRZ]: undefined;
  [ScreenName.PassportAttestationReadNFC]: {
    mrzData: MrzData;
  };
  [ScreenName.PassportAttestationConfirm]: {
    mrzData: MrzData;
  };
  [ScreenName.PassportAttestationSelectProof]: {
    mrzData: MrzData;
    passportData: PassportData;
  };
  [ScreenName.PassportAttestationGenerateProof]: {
    mrzData: MrzData;
    passportData: PassportData;
    selectedProofs: SelectedProof[];
  };
  [ScreenName.PassportAttestationSuccess]: {
    proof: AgeProof;
  };
};
