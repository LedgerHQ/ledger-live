//@flow
import React from "react";
import renderer from "react-test-renderer";
import connectData from "../connectData";
import { createRender, networkFromMock, flushPromises } from "../tests-utils";
import createMock, { AnimalQuery } from "../tests-utils/mock-1";

test("reloading boolean gets injected by default during a transition", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const Animal = connectData(
    ({ animal, reloading }) => animal.id + "_" + String(reloading),
    {
      queries: {
        animal: AnimalQuery
      },
      propsToQueryParams: ({ animalId }) => ({ animalId })
    }
  );
  const inst = renderer.create(render(<Animal animalId="id_max" />));
  expect(inst.toJSON()).toBe(null);
  net.tick();
  await flushPromises();
  expect(inst.toJSON()).toBe("id_max_false");
  inst.update(render(<Animal animalId="id_doge" />));
  expect(inst.toJSON()).toBe("id_max_true");
  net.tick();
  await flushPromises();
  expect(inst.toJSON()).toBe("id_doge_false");
  inst.unmount();
});
