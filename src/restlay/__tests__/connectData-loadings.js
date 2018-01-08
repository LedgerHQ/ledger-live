//@flow
import React from "react";
import renderer from "react-test-renderer";
import connectData from "../connectData";
import {
  createRender,
  networkFromMock,
  flushPromises,
  NullComponent
} from "../tests-utils";
import createMock, { AnimalsQuery } from "../tests-utils/mock-1";

test("RenderLoading gets rendered before network success", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const Animals = connectData(NullComponent, {
    RenderLoading: () => "LOADING...",
    queries: { animals: AnimalsQuery }
  });
  const inst = renderer.create(render(<Animals />));
  expect(inst.toJSON()).toBe("LOADING...");
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe(null);
  inst.unmount();
});
