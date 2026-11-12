import { fireEvent, render, screen } from "@support/jest/devtools/native";
import { buildProps, memberId } from "jest/intentWalletSyncProps";
import { headerCopy, logCopy, membersCopy } from "./copy";
import IntentWalletSync from "./IntentWalletSync";

const AT = Date.UTC(2026, 10, 5, 9, 4, 7, 12);

describe("IntentWalletSync", () => {
  it("should invite to launch an operation before any job state", () => {
    render(<IntentWalletSync {...buildProps()} />);

    expect(screen.getByText(headerCopy.idle)).toBeTruthy();
    expect(screen.getByText(logCopy.empty)).toBeTruthy();
    expect(screen.getByText(membersCopy.notLoaded)).toBeTruthy();
  });

  it("should launch add member, refresh and clear through the host", () => {
    const props = buildProps();
    render(<IntentWalletSync {...props} />);

    fireEvent.press(screen.getByText(headerCopy.addMember));
    fireEvent.press(screen.getByText(membersCopy.refresh));
    fireEvent.press(screen.getByText(headerCopy.clearLog));

    expect(props.onAddMember).toHaveBeenCalledTimes(1);
    expect(props.onRefreshMembers).toHaveBeenCalledTimes(1);
    expect(props.onClearLog).toHaveBeenCalledTimes(1);
  });

  it("should remove the member of the pressed row", () => {
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

    fireEvent.press(screen.getByLabelText(`${membersCopy.remove} Mobile`));

    expect(onRemoveMember).toHaveBeenCalledWith(memberId("member-2"));
  });

  it("should not launch anything while an operation is running", () => {
    const props = buildProps({ status: "running" });
    render(<IntentWalletSync {...props} />);

    fireEvent.press(screen.getByText(headerCopy.addMember));

    expect(screen.getByText(headerCopy.running)).toBeTruthy();
    expect(props.onAddMember).not.toHaveBeenCalled();
  });

  it("should list every job state with its operation and detail", () => {
    render(
      <IntentWalletSync
        {...buildProps({
          log: [{ at: AT, operation: "remove-member", jobState: "failed", detail: "not-allowed" }],
        })}
      />,
    );

    expect(screen.getByText("09:04:07.012")).toBeTruthy();
    expect(screen.getByText("remove-member")).toBeTruthy();
    expect(screen.getByText("failed")).toBeTruthy();
    expect(screen.getByText("not-allowed")).toBeTruthy();
  });
});
