import { buildProps } from "jest/intentWalletSyncProps";
import { headerCopy, membersCopy } from "./copy";
import { useIntentWalletSyncViewModel } from "./useIntentWalletSyncViewModel";

const AT = Date.UTC(2026, 10, 5, 9, 4, 7, 12);

describe("useIntentWalletSyncViewModel", () => {
  it("should allow every operation when idle with credentials and a trustchain", () => {
    const vm = useIntentWalletSyncViewModel(buildProps());

    expect(vm.isRunning).toBe(false);
    expect(vm.statusLabel).toBe(headerCopy.idle);
    expect(vm.warning).toBeNull();
    expect(vm.canAddMember).toBe(true);
    expect(vm.canRefreshMembers).toBe(true);
    expect(vm.canRemoveMember).toBe(true);
  });

  it("should block every operation while one is running", () => {
    const vm = useIntentWalletSyncViewModel(buildProps({ status: "running" }));

    expect(vm.statusLabel).toBe(headerCopy.running);
    expect(vm.canAddMember).toBe(false);
    expect(vm.canRefreshMembers).toBe(false);
    expect(vm.canRemoveMember).toBe(false);
  });

  it("should only allow add member without a trustchain", () => {
    const vm = useIntentWalletSyncViewModel(buildProps({ hasTrustchain: false }));

    expect(vm.warning).toBe(headerCopy.noTrustchain);
    expect(vm.canAddMember).toBe(true);
    expect(vm.canRefreshMembers).toBe(false);
    expect(vm.canRemoveMember).toBe(false);
  });

  it("should allow nothing without member credentials", () => {
    const vm = useIntentWalletSyncViewModel(buildProps({ hasMemberCredentials: false }));

    expect(vm.warning).toBe(headerCopy.noMemberCredentials);
    expect(vm.canAddMember).toBe(false);
    expect(vm.canRemoveMember).toBe(false);
  });

  it("should remove a member by its id and name the unnamed ones", () => {
    const onRemoveMember = jest.fn();
    const vm = useIntentWalletSyncViewModel(
      buildProps({
        members: [
          { id: "member-1", name: "Desktop" },
          { id: "member-2", name: "" },
        ],
        onRemoveMember,
      }),
    );

    vm.members?.[1].onRemove();

    expect(vm.members?.map(member => member.name)).toEqual(["Desktop", membersCopy.unnamed]);
    expect(onRemoveMember).toHaveBeenCalledWith("member-2");
  });

  it("should keep the members unloaded until the host fetches them", () => {
    expect(useIntentWalletSyncViewModel(buildProps()).members).toBeNull();
  });

  it("should format each log row with its UTC time and tone", () => {
    const vm = useIntentWalletSyncViewModel(
      buildProps({
        log: [
          { at: AT, operation: "add-member", jobState: "pending", detail: null },
          {
            at: AT,
            operation: "add-member",
            jobState: "awaiting-device-confirmation",
            detail: null,
          },
          { at: AT, operation: "add-member", jobState: "device-rejected", detail: null },
          { at: AT, operation: "remove-member", jobState: "failed", detail: "not-allowed" },
          { at: AT, operation: "remove-member", jobState: "completed", detail: "root-id" },
        ],
      }),
    );

    expect(
      vm.logLines.map(({ time, jobState, tone, detail }) => [time, jobState, tone, detail]),
    ).toEqual([
      ["09:04:07.012", "pending", "neutral", null],
      ["09:04:07.012", "awaiting-device-confirmation", "warning", null],
      ["09:04:07.012", "device-rejected", "warning", null],
      ["09:04:07.012", "failed", "error", "not-allowed"],
      ["09:04:07.012", "completed", "success", "root-id"],
    ]);
    expect(new Set(vm.logLines.map(line => line.key)).size).toBe(5);
  });
});
