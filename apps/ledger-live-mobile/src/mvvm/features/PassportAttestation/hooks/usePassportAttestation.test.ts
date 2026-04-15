import { act, renderHook } from "@tests/test-renderer";
import { usePassportAttestation } from "./usePassportAttestation";
import { setAgeAttestation } from "~/reducers/ageAttestation";

const mockDispatch = jest.fn();
const mockOnUserRefresh = jest.fn();
const mockGenerateAgeProof = jest.fn();
const mockVerifyAgeProof = jest.fn();

jest.mock("~/context/hooks", () => ({
  ...jest.requireActual("~/context/hooks"),
  useDispatch: () => mockDispatch,
  useSelector: () => ({
    verified: false,
    proof: null,
    publicSignals: null,
    minimumAge: null,
    verifiedAt: null,
    proofHash: null,
  }),
}));

jest.mock("LLM/features/WalletSync/components/WalletSyncContext", () => ({
  useWalletSyncUserState: () => ({
    onUserRefresh: mockOnUserRefresh,
  }),
}));

jest.mock("../utils/passportReader", () => ({
  readPassportNfc: jest.fn(),
  isNfcSupported: jest.fn(),
}));

jest.mock("../utils/zkProof", () => ({
  ...jest.requireActual("../utils/zkProof"),
  generateAgeProof: (...args: unknown[]) => mockGenerateAgeProof(...args),
  verifyAgeProof: (...args: unknown[]) => mockVerifyAgeProof(...args),
}));

const mrzData = {
  documentNumber: "23AT30794",
  dateOfBirth: "960114",
  expiryDate: "330325",
  nationality: "FRA",
  surname: "DOE",
  givenNames: "JOHN",
  sex: "M",
};

const passportData = {
  dateOfBirth: "1996-01-14",
  documentNumber: "23AT30794",
  nationality: "FRA",
  expiryDate: "2033-03-25",
  firstName: "JOHN",
  lastName: "DOE",
  gender: "M",
  mrz: "MRZ",
};

const proof = {
  proof: '{"protocol":"groth16","curve":"bn128"}',
  publicSignals: ["20260415", "18"],
  minimumAge: 18,
  verifiedAt: "2026-04-15T12:58:22.000Z",
  proofHash: "abc123de",
};

describe("usePassportAttestation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateAgeProof.mockResolvedValue(proof);
    mockVerifyAgeProof.mockResolvedValue(true);
  });

  it("should create a proof without persisting or syncing it", async () => {
    const { result } = renderHook(() => usePassportAttestation());

    let createdProof;
    await act(async () => {
      createdProof = await result.current.createProof(mrzData, passportData);
    });

    expect(createdProof).toEqual(proof);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockOnUserRefresh).not.toHaveBeenCalled();
  });

  it("should persist the provided age attestation and trigger wallet sync refresh", async () => {
    const { result } = renderHook(() => usePassportAttestation());

    const encryptedAgeAttestation = {
      verified: true,
      proof: "deadbeef",
      publicSignals: proof.publicSignals,
      minimumAge: proof.minimumAge,
      verifiedAt: proof.verifiedAt,
      proofHash: proof.proofHash,
    };

    await act(async () => {
      await result.current.saveAgeAttestation(encryptedAgeAttestation);
    });

    expect(mockDispatch).toHaveBeenCalledWith(setAgeAttestation(encryptedAgeAttestation));
    expect(mockOnUserRefresh).toHaveBeenCalledTimes(1);
  });
});
