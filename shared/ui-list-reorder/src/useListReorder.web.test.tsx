import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useListReorder } from "./useListReorder.web";

function ReorderList({ onMove }: Readonly<{ onMove: (id: string, toIndex: number) => void }>) {
  const reorder = useListReorder({ onMove });

  return (
    <>
      <div>
        {["one", "two", "three"].map(id => (
          <div key={id} {...reorder.getRowProps(id)}>
            <button {...reorder.getHandleProps(id)}>{id}</button>
          </div>
        ))}
      </div>
      <output aria-live="polite">{reorder.announcement}</output>
    </>
  );
}

describe("useListReorder", () => {
  it("arms HTML drag from the handle and moves on row drop", () => {
    const onMove = jest.fn();
    render(<ReorderList onMove={onMove} />);
    const dataTransfer = {
      effectAllowed: "",
      setData: jest.fn(),
      getData: jest.fn(() => "one"),
    };

    fireEvent.pointerDown(screen.getByRole("button", { name: "one" }));
    fireEvent.dragStart(screen.getByText("one").parentElement!, { dataTransfer });
    fireEvent.dragOver(screen.getByText("three").parentElement!, { dataTransfer });
    fireEvent.drop(screen.getByText("three").parentElement!, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "one");
    expect(onMove).toHaveBeenCalledWith("one", 2);
  });

  it("supports keyboard pickup, movement, and cancellation", async () => {
    const user = userEvent.setup();
    const onMove = jest.fn();
    render(<ReorderList onMove={onMove} />);
    const handle = screen.getByRole("button", { name: "two" });

    await user.click(handle);
    await user.keyboard(" ");
    expect(handle).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{ArrowUp}");
    expect(onMove).toHaveBeenCalledWith("two", 0);
    expect(screen.getByRole("status")).toHaveTextContent("Moved item to position 1.");
    await user.keyboard("{Escape}");
    expect(handle).toHaveAttribute("aria-pressed", "false");
  });
});
