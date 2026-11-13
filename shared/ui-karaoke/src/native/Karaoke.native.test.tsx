import React from "react";
import { AccessibilityInfo, Text } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";
import { Karaoke, karaokeTestIds } from "./index";

describe("Karaoke", () => {
  it("should replace the sequence with the final after the last tap", async () => {
    const user = userEvent.setup();
    render(
      <Karaoke.Root phrases={["First.", "Last."]} tapLabel="Tap">
        <Karaoke.Sequence />
        <Karaoke.Final>
          <Text>Final screen</Text>
        </Karaoke.Final>
      </Karaoke.Root>,
    );

    await user.press(screen.getByTestId(karaokeTestIds.advance));

    expect(screen.getByText("Last.")).toBeOnTheScreen();
    expect(screen.getByText("Tap")).toBeVisible();
    expect(screen.queryByText("Final screen")).toBeNull();

    await user.press(screen.getByTestId(karaokeTestIds.advance));

    expect(screen.getByText("Final screen")).toBeOnTheScreen();
    expect(screen.queryByText("Last.")).toBeNull();
  });

  it("should accept any set of phrases", () => {
    render(
      <Karaoke.Root phrases={["Only line."]} tapLabel="Tap">
        <Karaoke.Sequence action={<Text>Done</Text>} />
      </Karaoke.Root>,
    );

    expect(screen.getByText("Only line.")).toBeOnTheScreen();
    expect(screen.getByText("Done")).toBeOnTheScreen();
    expect(screen.queryByText("Tap")).toBeNull();
  });

  it("should read each new phrase to screen readers", async () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility");
    const user = userEvent.setup();
    render(
      <Karaoke.Root phrases={["First.", "Second."]} tapLabel="Tap">
        <Karaoke.Sequence />
      </Karaoke.Root>,
    );

    await user.press(screen.getByTestId(karaokeTestIds.advance));

    expect(announce).toHaveBeenCalledWith("Second.");
    announce.mockRestore();
  });

  it("should hide the tap area from screen readers once the action shows", async () => {
    const user = userEvent.setup();
    render(
      <Karaoke.Root phrases={["First.", "Last."]} tapLabel="Tap">
        <Karaoke.Sequence action={<Text>Done</Text>} />
      </Karaoke.Root>,
    );
    expect(screen.getByRole("button", { name: "Tap" })).toBeOnTheScreen();

    await user.press(screen.getByTestId(karaokeTestIds.advance));

    expect(screen.getByText("Done")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Tap" })).toBeNull();
    expect(
      screen.getByTestId(karaokeTestIds.advance, { includeHiddenElements: true }),
    ).toBeDisabled();
  });

  it("should treat a null action as no action and let the last tap finish", async () => {
    const user = userEvent.setup();
    render(
      <Karaoke.Root phrases={["First.", "Last."]} tapLabel="Tap">
        <Karaoke.Sequence action={null} />
        <Karaoke.Final>
          <Text>Final screen</Text>
        </Karaoke.Final>
      </Karaoke.Root>,
    );

    await user.press(screen.getByTestId(karaokeTestIds.advance));
    expect(screen.getByText("Tap")).toBeOnTheScreen();

    await user.press(screen.getByTestId(karaokeTestIds.advance));
    expect(screen.getByText("Final screen")).toBeOnTheScreen();
    expect(screen.queryByText("Last.")).toBeNull();
  });

  it("should show the same phrase twice", async () => {
    const user = userEvent.setup();
    render(
      <Karaoke.Root phrases={["Again.", "Again."]} tapLabel="Tap">
        <Karaoke.Sequence />
      </Karaoke.Root>,
    );

    await user.press(screen.getByTestId(karaokeTestIds.advance));

    expect(screen.getAllByText("Again.")).toHaveLength(2);
  });
});
