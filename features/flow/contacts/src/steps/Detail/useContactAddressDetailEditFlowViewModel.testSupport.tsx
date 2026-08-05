import { CONTACT_SIGNER_MISMATCH_ERROR } from "@domain/entity-contact";
import { mockContactWithAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import {
  createMockContactSignerValidationPort,
  type ContactSignerValidationPort,
} from "../../platform/contactSignerValidationPort";
import { makeContactsWrapper } from "./__tests__/contactsStoreTestUtils";
import type { ContactAddressDetailEditFlowPorts } from "./model/ports";
import { useContactAddressDetailEditFlowViewModel } from "./useContactAddressDetailEditFlowViewModel";

type TestAct = (callback: () => void | Promise<void>) => void | Promise<void>;
type TestRenderHook = <Result, Props>(
  hook: (props: Props) => Result,
  options?: { wrapper?: React.ComponentType<{ children: React.ReactNode }> },
) => { result: { current: Result } };

export function createEditFlowPorts(
  overrides: Partial<ContactAddressDetailEditFlowPorts> = {},
): ContactAddressDetailEditFlowPorts {
  return {
    deletion: {
      deleteAddress: jest.fn().mockResolvedValue(undefined),
    },
    signerValidation: createMockContactSignerValidationPort(),
    ...overrides,
  };
}

function renderAddressEditFlow({
  act,
  renderHook,
  ports = createEditFlowPorts(),
}: {
  act: TestAct;
  renderHook: TestRenderHook;
  ports?: ContactAddressDetailEditFlowPorts;
}) {
  const contact = mockContactWithAddress();
  const address = contact.addresses[0]!;
  const Wrapper = makeContactsWrapper([mockMeContact(), contact]);
  const { result } = renderHook(
    () =>
      useContactAddressDetailEditFlowViewModel({
        contactId: contact.id,
        addressId: address.id,
        ports,
      }),
    { wrapper: Wrapper },
  );

  return { act, result };
}

export function defineUseContactAddressDetailEditFlowViewModelTests({
  act,
  renderHook,
}: {
  act: TestAct;
  renderHook: TestRenderHook;
}) {
  describe("useContactAddressDetailEditFlowViewModel", () => {
    it("validates the signer before opening the edit flow", async () => {
      const { result } = renderAddressEditFlow({ act, renderHook });

      act(() => {
        result.current.onEditPress();
      });

      expect(result.current.isSignerRequiredForEdit).toBe(true);
      expect(result.current.editUiState).toBe("signer-open");

      await act(async () => {
        await result.current.onSignerConfirm();
      });

      expect(result.current.signerValidationState).toEqual({ status: "valid" });
      expect(result.current.editUiState).toBe("edit-open");

      act(() => {
        result.current.onSignerCancel();
      });

      expect(result.current.editUiState).toBe("edit-open");
    });

    it("returns signer_mismatch when the mocked signer differs", async () => {
      const mismatchPort: ContactSignerValidationPort = createMockContactSignerValidationPort({
        currentSignerId: "signer-b",
      });
      const { result } = renderAddressEditFlow({
        act,
        renderHook,
        ports: createEditFlowPorts({ signerValidation: mismatchPort }),
      });

      act(() => {
        result.current.onEditPress();
      });

      await act(async () => {
        await result.current.onSignerConfirm();
      });

      expect(result.current.signerValidationState).toEqual({
        status: CONTACT_SIGNER_MISMATCH_ERROR,
      });
      expect(result.current.editUiState).toBe("signer-open");
    });
  });
}
