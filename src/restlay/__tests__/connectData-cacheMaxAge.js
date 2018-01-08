//@flow
import React from "react";
import invariant from "invariant";
import renderer from "react-test-renderer";
import connectData from "../connectData";
import {
  delay,
  createRender,
  networkFromMock,
  flushPromises
} from "../tests-utils";
import createMock, { AnimalQuery } from "../tests-utils/mock-1";

test("if a query defines cacheMaxAge, have recent cache, it should not fetch again but instantly draw", async () => {
  const mock = createMock();
  const net = networkFromMock(mock);
  const render = createRender(net.network);
  const Animal = connectData(({ animal }) => animal.name + "_" + animal.age, {
    queries: {
      animal: AnimalQuery
    },
    propsToQueryParams: ({ animalId }) => ({ animalId }),
    RenderLoading: () => "loading",
    RenderError: () => "error",
    optimisticRendering: true
  });
  const inst = renderer.create(render(<Animal animalId="id_doge" />));
  expect(inst.toJSON()).toBe("loading");
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("doge_5");
  inst.update(render(null));
  expect(inst.toJSON()).toBe(null);
  mock.incrementAge();
  inst.update(render(<Animal animalId="id_doge" />));
  expect(net.tick()).toBe(0);
  expect(inst.toJSON()).toBe("doge_5");
  inst.unmount();
});

test("new props where data is cached", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const Animal = connectData(({ animal }) => animal.name, {
    RenderLoading: () => "loading",
    RenderError: ({ error }) => error.message,
    queries: { animal: AnimalQuery },
    propsToQueryParams: ({ animalId }) => ({ animalId })
  });
  const inst = renderer.create(render(<Animal animalId="id_max" />));
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("max");
  inst.update(render(<Animal animalId="id_doge" />));
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("doge");
  inst.update(render(<Animal animalId="id_max" />));
  expect(net.tick()).toBe(0);
  await flushPromises();
  expect(inst.toJSON()).toBe("max");
  inst.update(render(<Animal animalId="id_doge" />));
  expect(net.tick()).toBe(0);
  await flushPromises();
  expect(inst.toJSON()).toBe("doge");
  inst.unmount();
});

test("if a query have cacheMaxAge, but cache is too old, it should fetch again on a new mount", async () => {
  const mock = createMock();
  const net = networkFromMock(mock);
  const render = createRender(net.network);
  const Animal = connectData(({ animal }) => animal.name + "_" + animal.age, {
    queries: {
      animal: AnimalQuery
    },
    propsToQueryParams: ({ animalId }) => ({ animalId }),
    RenderLoading: () => "loading",
    RenderError: () => "error",
    optimisticRendering: true
  });
  const inst = renderer.create(render(<Animal animalId="id_doge" />));
  expect(inst.toJSON()).toBe("loading");
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("doge_5");
  inst.update(render(null));
  expect(inst.toJSON()).toBe(null);
  mock.incrementAge();
  await delay(3000);
  inst.update(render(<Animal animalId="id_doge" />));
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("doge_6");
  inst.unmount();
});

test("forceFetch option always ignore the cache and trigger re-fetch", async () => {
  const mock = createMock();
  const net = networkFromMock(mock);
  const render = createRender(net.network);
  let restlay;
  const Animal = connectData(
    props => (
      (restlay = props.restlay), props.animal.name + "_" + props.animal.age
    ),
    {
      queries: {
        animal: AnimalQuery
      },
      propsToQueryParams: ({ animalId }) => ({ animalId }),
      RenderLoading: () => "loading",
      RenderError: () => "error",
      optimisticRendering: true
    }
  );
  const inst = renderer.create(render(<Animal animalId="id_doge" />));
  expect(inst.toJSON()).toBe("loading");
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("doge_5");
  mock.incrementAge();
  invariant(restlay, "restlay is defined");
  restlay.forceFetch();
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("doge_6");
  inst.unmount();
});
