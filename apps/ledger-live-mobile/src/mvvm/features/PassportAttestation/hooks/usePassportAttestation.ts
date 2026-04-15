import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { setAgeAttestation, ageAttestationSelector } from "~/reducers/ageAttestation";
import type { AgeAttestationLocalState } from "~/reducers/ageAttestation";
import { useWalletSyncUserState } from "LLM/features/WalletSync/components/WalletSyncContext";
import type { MrzData } from "../utils/mrzParser";
import { mrzDateToFullDate, computeMrzHash } from "../utils/mrzParser";
import {
  readPassportNfc,
  isNfcSupported,
  type PassportData,
} from "../utils/passportReader";
import { generateAgeProof, verifyAgeProof, type AgeProof } from "../utils/zkProof";

const MINIMUM_AGE = 18;

type PassportAttestationState = {
  isLoading: boolean;
  error: string | null;
  nfcSupported: boolean | null;
};

/**
 * Parse a date string (YYYY-MM-DD from NFC chip) into a YYYYMMDD integer.
 * NOTE: The NFC library (react-native-nfc-passport-reader) reads birthDate
 * from DG11 using SimpleDateFormat("yyMMdd"), which misparses 8-digit
 * YYYYMMDD dates stored in DG11. We therefore use the MRZ-scanned date
 * (validated by check digit during scanning) as the authoritative DOB for
 * the ZK circuit. The NFC step still provides cryptographic proof the
 * passport chip is genuine via BAC authentication.
 */
function mrzDobToInt(mrzData: MrzData): number {
  return mrzDateToFullDate(mrzData.dateOfBirth);
}

export function usePassportAttestation() {
  const dispatch = useDispatch();
  const attestation = useSelector(ageAttestationSelector);
  const { onUserRefresh } = useWalletSyncUserState();
  const [state, setState] = useState<PassportAttestationState>({
    isLoading: false,
    error: null,
    nfcSupported: null,
  });

  const checkNfcSupport = useCallback(async () => {
    const supported = await isNfcSupported();
    setState(prev => ({ ...prev, nfcSupported: supported }));
    return supported;
  }, []);

  const readPassport = useCallback(async (mrzData: MrzData): Promise<PassportData> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const passportData = await readPassportNfc(mrzData);
      setState(prev => ({ ...prev, isLoading: false }));
      return passportData;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to read passport";
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      throw e;
    }
  }, []);

  const createProof = useCallback(
    async (mrzData: MrzData, passportData: PassportData): Promise<AgeProof> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const dob = mrzDobToInt(mrzData);
        const now = new Date();
        const currentDate = parseInt(
          `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`,
          10,
        );
        const mrzHash = computeMrzHash(mrzData);

        const proof = await generateAgeProof(dob, mrzHash, currentDate, MINIMUM_AGE);
        const valid = await verifyAgeProof(proof);

        if (!valid) {
          throw new Error("Generated proof failed local verification");
        }

        setState(prev => ({ ...prev, isLoading: false }));
        return proof;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to generate proof";
        setState(prev => ({ ...prev, isLoading: false, error: message }));
        throw e;
      }
    },
    [],
  );

  const saveAgeAttestation = useCallback(
    async (ageAttestation: AgeAttestationLocalState) => {
      dispatch(setAgeAttestation(ageAttestation));
      onUserRefresh();
    },
    [dispatch, onUserRefresh],
  );

  return {
    attestation,
    isVerified: attestation.verified,
    isLoading: state.isLoading,
    error: state.error,
    nfcSupported: state.nfcSupported,
    checkNfcSupport,
    readPassport,
    createProof,
    saveAgeAttestation,
  };
}
