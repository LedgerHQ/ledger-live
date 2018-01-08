//@flow
import React from "react";
import invariant from "invariant";
import renderer from "react-test-renderer";
import connectData from "../connectData";
import {
  createRender,
  networkFromMock,
  flushPromises,
  NullComponent
} from "../tests-utils";
import createMock, { AnimalQuery, AnimalsQuery } from "../tests-utils/mock-1";

test("RenderError gets rendered if network fails. it receives error that is the exact thrown error", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const AnimalNotFound = connectData(NullComponent, {
    RenderLoading: () => "LOADING...",
    RenderError: ({ error }) => error.toString(),
    queries: { animal: AnimalQuery },
    propsToQueryParams: () => ({ animalId: "DOES_NOT_EXIST" })
  });
  const inst = renderer.create(render(<AnimalNotFound />));
  expect(inst.toJSON()).toBe("LOADING...");
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("notfound");
  inst.unmount();
});

test("RenderError is by default rendering null", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const AnimalNotFound = connectData(NullComponent, {
    queries: { animal: AnimalQuery },
    propsToQueryParams: () => ({ animalId: "DOES_NOT_EXIST" })
  });
  const inst = renderer.create(render(<AnimalNotFound />));
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe(null);
  inst.unmount();
});

test("RenderError gets rendered if an error is thrown in a child", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const expectedThrownError = new Error("expectedThrownError");
  // $FlowFixMe
  expectedThrownError.suppressReactErrorLogging = true;
  const AnimalNotFound = connectData(
    () => {
      throw expectedThrownError;
    },
    {
      RenderLoading: () => "LOADING...",
      RenderError: ({ error }) => error.message,
      queries: { animal: AnimalQuery },
      propsToQueryParams: () => ({ animalId: "id_max" })
    }
  );
  const inst = renderer.create(render(<AnimalNotFound />));
  expect(inst.toJSON()).toBe("LOADING...");
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("expectedThrownError");
  inst.unmount();
});

test("a network error can be recovered after an update", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const Animal = connectData(({ animal }) => animal.id, {
    RenderError: () => "oops",
    queries: { animal: AnimalQuery },
    propsToQueryParams: ({ animalId }) => ({ animalId })
  });
  const inst = renderer.create(render(<Animal animalId="DOES_NOT_EXIST" />));
  net.tick();
  await flushPromises();
  expect(inst.toJSON()).toBe("oops");
  inst.update(render(<Animal animalId="id_doge" />));
  net.tick();
  await flushPromises();
  expect(inst.toJSON()).toBe("id_doge");
  inst.unmount();
});

test("a network error can be recovered after an update when many queries", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const Animal = connectData(({ animal }) => animal.id, {
    RenderError: () => "oops",
    queries: { animal: AnimalQuery, animals: AnimalsQuery },
    // $FlowFixMe
    propsToQueryParams: ({ animalId }) => ({ animalId })
  });
  const inst = renderer.create(render(<Animal animalId="DOES_NOT_EXIST" />));
  net.tick();
  await flushPromises();
  expect(inst.toJSON()).toBe("oops");
  inst.update(render(<Animal animalId="id_doge" />));
  net.tick();
  await flushPromises();
  expect(inst.toJSON()).toBe("id_doge");
  inst.unmount();
});

test("a network error can be forceFetched without error", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let rlay;
  const Animal = connectData(NullComponent, {
    RenderError: ({ restlay }) => ((rlay = restlay), "oops"),
    queries: { animal: AnimalQuery },
    propsToQueryParams: ({ animalId }) => ({ animalId })
  });
  const inst = renderer.create(render(<Animal animalId="DOES_NOT_EXIST" />));
  net.tick();
  await flushPromises();
  invariant(rlay, "restlay is available");
  expect(inst.toJSON()).toBe("oops");
  rlay.forceFetch();
  net.tick();
  await flushPromises();
  expect(inst.toJSON()).toBe("oops");
  rlay.forceFetch();
  rlay.forceFetch();
  rlay.forceFetch();
  net.tick();
  await flushPromises();
  expect(inst.toJSON()).toBe("oops");
  inst.unmount();
});

test("a thrown error can be recovered after an update", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const Animal = connectData(
    ({ animal }) => {
      if (animal.id === "id_max") {
        const err = new Error("sorry_max");
        //$FlowFixMe
        err.suppressReactErrorLogging = true;
        throw err;
      }
      return animal.id;
    },
    {
      RenderError: ({ error }) => error.message,
      queries: { animal: AnimalQuery },
      propsToQueryParams: ({ animalId }) => ({ animalId })
    }
  );
  const inst = renderer.create(render(<Animal animalId="id_max" />));
  net.tick();
  await flushPromises();
  expect(inst.toJSON()).toBe("sorry_max");
  inst.update(render(<Animal animalId="id_doge" />));
  net.tick();
  await flushPromises();
  expect(inst.toJSON()).toBe("id_doge");
  inst.unmount();
});
