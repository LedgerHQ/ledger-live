import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import CollapsibleStep from "../components/CollapsibleStep";

const MockText = () => <Text>Inner text</Text>;

describe("CollapsibleStep", () => {
  describe("when not collapsed", () => {
    it("should render complete correctly", async () => {
      render(
        <CollapsibleStep status="complete" isCollapsed={false} title="Title">
          <MockText />
        </CollapsibleStep>,
      );

      expect(await screen.findByText("Inner text")).toBeOnTheScreen();
      expect(await screen.findByText("Title")).toBeOnTheScreen();

      expect(await screen.findByTestId("status-icon")).toBeOnTheScreen();
      expect(await screen.findByTestId("green-checkmark")).toBeOnTheScreen();
    });

    it("should render unfinished correctly", async () => {
      render(
        <CollapsibleStep status="unfinished" isCollapsed={false} title="Title">
          <MockText />
        </CollapsibleStep>,
      );

      expect(await screen.findByText("Inner text")).toBeOnTheScreen();
      expect(await screen.findByText("Title")).toBeOnTheScreen();

      expect(await screen.findByTestId("status-icon")).toBeOnTheScreen();
      expect(await screen.queryByTestId("green-checkmark")).not.toBeOnTheScreen();
    });

    it("should hide title", async () => {
      render(
        <CollapsibleStep hideTitle status="unfinished" isCollapsed={false} title="Title">
          <MockText />
        </CollapsibleStep>,
      );

      expect(await screen.findByText("Inner text")).toBeOnTheScreen();
      expect(await screen.queryByText("Title")).not.toBeOnTheScreen();

      expect(await screen.findByTestId("status-icon")).toBeOnTheScreen();
    });

    it("should show done subtitle", async () => {
      render(
        <CollapsibleStep
          showDoneSubtitle
          doneSubTitle="DONE"
          status="unfinished"
          isCollapsed={false}
          title="Title"
        >
          <MockText />
        </CollapsibleStep>,
      );

      expect(await screen.findByText("Inner text")).toBeOnTheScreen();
      expect(await screen.findByText("DONE")).toBeOnTheScreen();
      expect(await screen.findByText("Title")).toBeOnTheScreen();
      expect(await screen.findByTestId("status-icon")).toBeOnTheScreen();
    });
  });

  describe("when collapsed", () => {
    it("should render complete correctly", async () => {
      render(
        <CollapsibleStep status="complete" isCollapsed title="Title" doneSubTitle="DONE">
          <MockText />
        </CollapsibleStep>,
      );

      expect(await screen.queryByText("Inner text")).not.toBeOnTheScreen();
      expect(await screen.findByText("Title")).toBeOnTheScreen();
      expect(await screen.findByText("DONE")).toBeOnTheScreen();

      expect(await screen.findByTestId("status-icon")).toBeOnTheScreen();
      expect(await screen.findByTestId("green-checkmark")).toBeOnTheScreen();
    });

    it("should render unfinished correctly", async () => {
      render(
        <CollapsibleStep status="unfinished" isCollapsed title="Title" doneSubTitle="DONE">
          <MockText />
        </CollapsibleStep>,
      );

      expect(await screen.queryByText("Inner text")).not.toBeOnTheScreen();
      expect(await screen.findByText("Title")).toBeOnTheScreen();
      expect(await screen.queryByText("DONE")).not.toBeOnTheScreen();

      expect(await screen.findByTestId("status-icon")).toBeOnTheScreen();
      expect(await screen.queryByTestId("green-checkmark")).not.toBeOnTheScreen();
    });
  });
});
