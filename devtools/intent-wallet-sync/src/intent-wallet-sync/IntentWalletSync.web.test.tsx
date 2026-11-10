import { render, screen } from "@support/jest/devtools/web";
import userEvent from "@testing-library/user-event";
import { buildProps, memberId } from "jest/intentWalletSyncProps";
import { headerCopy, logCopy, membersCopy } from "./copy";
import IntentWalletSync from "./IntentWalletSync";

const AT = Date.UTC(2026, 10, 5, 9, 4, 7, 12);

describe("IntentWalletSync", () => {
  it("should invite to launch an operation before any job state", () => {
    render(<IntentWalletSync {...buildProps()} />);

    expect(screen.getByText(headerCopy.idle)).toBeInTheDocument();
    expect(screen.getByText(logCopy.empty)).toBeInTheDocument();
    expect(screen.getByText(membersCopy.notLoaded)).toBeInTheDocument();
  });

  it("should launch add member, refresh and clear through the host", async () => {
    const props = buildProps();
    render(<IntentWalletSync {...props} />);

    await userEvent.click(screen.getByRole("button", { name: headerCopy.addMember }));
    await userEvent.click(screen.getByRole("button", { name: membersCopy.refresh }));
    await userEvent.click(screen.getByRole("button", { name: headerCopy.clearLog }));

    expect(props.onAddMember).toHaveBeenCalledTimes(1);
    expect(props.onRefreshMembers).toHaveBeenCalledTimes(1);
    expect(props.onClearLog).toHaveBeenCalledTimes(1);
  });

  it("should remove the member of the pressed row", async () => {
    const onRemoveMember = jest.fn();
    render(
      <IntentWalletSync
        {...buildProps({
          members: [
            { id: memberId("member-1"), name: "Desktop" },
            { id: memberId("member-2"), name: "Mobile" },
          ],
          onRemoveMember,
        })}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: `${membersCopy.remove} Mobile` }));

    expect(onRemoveMember).toHaveBeenCalledWith(memberId("member-2"));
  });

  it("should disable the operations while one is running", () => {
    render(
      <IntentWalletSync
        {...buildProps({
          status: "running",
          members: [{ id: memberId("member-1"), name: "Desktop" }],
        })}
      />,
    );

    expect(screen.getByText(headerCopy.running)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: headerCopy.addMember })).toBeDisabled();
    expect(screen.getByRole("button", { name: membersCopy.refresh })).toBeDisabled();
    expect(screen.getByRole("button", { name: `${membersCopy.remove} Desktop` })).toBeDisabled();
  });

  it("should warn when the instance has no trustchain", () => {
    render(<IntentWalletSync {...buildProps({ hasTrustchain: false, members: [] })} />);

    expect(screen.getByText(headerCopy.noTrustchain)).toBeInTheDocument();
    expect(screen.getByText(membersCopy.empty)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: headerCopy.addMember })).toBeEnabled();
  });

  it("should list every job state with its operation and detail", () => {
    render(
      <IntentWalletSync
        {...buildProps({
          log: [
            {
              at: AT,
              operation: "add-member",
              jobState: "awaiting-device-confirmation",
              detail: null,
            },
            {
              at: AT + 1,
              operation: "add-member",
              jobState: "failed",
              detail: "already-secured-other-seed",
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("awaiting-device-confirmation")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(screen.getByText("already-secured-other-seed")).toBeInTheDocument();
    expect(screen.getByText("09:04:07.013")).toBeInTheDocument();
    expect(screen.getAllByText("add-member")).toHaveLength(2);
  });
});
