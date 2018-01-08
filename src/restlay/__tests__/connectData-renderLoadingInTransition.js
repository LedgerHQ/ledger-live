//@flow
import React from "react";
import renderer from "react-test-renderer";
import connectData from "../connectData";
import { createRender, networkFromMock, flushPromises } from "../tests-utils";
import createMock, { AnimalQuery } from "../tests-utils/mock-1";

test("renderLoadingInTransition=true should render Loading in a simple transition", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const Animal = connectData(({ animal }) => animal.name, {
    queries: { animal: AnimalQuery },
    propsToQueryParams: ({ animalId }) => ({ animalId }),
    renderLoadingInTransition: true,
    RenderLoading: () => "loading"
  });
  const inst = renderer.create(render(<Animal animalId="id_max" />));
  net.tick();
  await flushPromises();
  expect(inst.toJSON()).toBe("max");
  inst.update(render(<Animal animalId="id_doge" />));
  expect(inst.toJSON()).toBe("loading");
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("doge");
  inst.unmount();
});
