import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import {
  ageAttestationSelector,
  isAgeVerifiedSelector,
} from "~/renderer/reducers/ageAttestation";
import type { AgeAttestationLocalState } from "~/renderer/reducers/ageAttestation";

export type IdentityViewModel = {
  isVerified: boolean;
  attestation: AgeAttestationLocalState;
  qrCodeData: string;
  handleBack: () => void;
};

export function useIdentityViewModel(): IdentityViewModel {
  const navigate = useNavigate();
  const isVerified = useSelector(isAgeVerifiedSelector);
  const attestation = useSelector(ageAttestationSelector);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const qrCodeData = "ledgerlive://ledger-proof";

  return {
    isVerified,
    attestation,
    qrCodeData,
    handleBack,
  };
}
