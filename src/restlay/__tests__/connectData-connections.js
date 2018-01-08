//@flow
import React from "react";
import invariant from "invariant";
import renderer from "react-test-renderer";
import connectData from "../connectData";
import { createRender, networkFromMock, flushPromises } from "../tests-utils";
import createMock, { WorldQuery } from "../tests-utils/mock-1";

// TODO setVariables returns a promise that ends on completion
// TODO test using getVariables()

test("connection query works with initial query", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  const World = connectData(
    ({ world }) =>
      "hasNextPage=" +
      world.pageInfo.hasNextPage +
      " " +
      world.edges.map(e => e.cursor + ":" + e.node.id).join("|"),
    {
      queries: {
        world: WorldQuery
      },
      initialVariables: {
        world: 3
      }
    }
  );
  const inst = renderer.create(render(<World />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("hasNextPage=true C_w_0:w_0|C_w_1:w_1|C_w_2:w_2");
  inst.unmount();
});

test("connection query pagination can be pulled once", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let rlay,
    renders = 0;
  const World = connectData(
    ({ world, restlay }) => (
      (rlay = restlay),
      renders++,
      "hasNextPage=" +
        world.pageInfo.hasNextPage +
        " " +
        world.edges.map(e => e.cursor + ":" + e.node.id).join("|")
    ),
    {
      queries: {
        world: WorldQuery
      },
      initialVariables: {
        world: 2
      },
      freezeTransition: true
    }
  );
  const inst = renderer.create(render(<World />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(renders).toBe(1);
  expect(inst.toJSON()).toBe("hasNextPage=true C_w_0:w_0|C_w_1:w_1");
  invariant(rlay, "restlay available");
  rlay.setVariables({
    world: 5
  });
  expect(inst.toJSON()).toBe("hasNextPage=true C_w_0:w_0|C_w_1:w_1");
  expect(renders).toBe(1);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(renders).toBe(2);
  expect(inst.toJSON()).toBe(
    "hasNextPage=true C_w_0:w_0|C_w_1:w_1|C_w_2:w_2|C_w_3:w_3|C_w_4:w_4"
  );
  inst.unmount();
});

test("connection query pagination can be pulled many times", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let rlay,
    renders = 0;
  const World = connectData(
    ({ world, restlay }) => (
      (rlay = restlay),
      renders++,
      world.pageInfo.hasNextPage + " " + world.edges.length
    ),
    {
      queries: {
        world: WorldQuery
      },
      initialVariables: {
        world: 10
      },
      freezeTransition: true
    }
  );
  const inst = renderer.create(render(<World />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(renders).toBe(1);
  invariant(rlay, "restlay available");
  for (let i = 1; i < 100; i++) {
    expect(inst.toJSON()).toBe("true " + i * 10);
    rlay.setVariables({
      world: rlay.getVariables().world + 10
    });
    expect(net.tick()).toBe(1);
    await flushPromises();
  }
  expect(renders).toBe(100);
  expect(inst.toJSON()).toBe("false 1000");
  rlay.setVariables({
    world: rlay.getVariables().world + 10
  });
  expect(net.tick()).toBe(0);
  await flushPromises();
  expect(inst.toJSON()).toBe("false 1000");
  expect(renders).toBe(100);
  inst.unmount();
});

test("connection query pages size can be reduced and result of a slice without extra query", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let rlay,
    renders = 0;
  const World = connectData(
    ({ world, restlay }) => (
      (rlay = restlay),
      renders++,
      "hasNextPage=" +
        world.pageInfo.hasNextPage +
        " " +
        world.edges.map(e => e.cursor + ":" + e.node.id).join("|")
    ),
    {
      queries: {
        world: WorldQuery
      },
      initialVariables: {
        world: 5
      },
      freezeTransition: true
    }
  );
  const inst = renderer.create(render(<World />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(renders).toBe(1);
  expect(inst.toJSON()).toBe(
    "hasNextPage=true C_w_0:w_0|C_w_1:w_1|C_w_2:w_2|C_w_3:w_3|C_w_4:w_4"
  );
  invariant(rlay, "restlay available");
  rlay.setVariables({
    world: 2
  });
  expect(net.tick()).toBe(0);
  await flushPromises();
  expect(renders).toBe(2);
  expect(inst.toJSON()).toBe("hasNextPage=true C_w_0:w_0|C_w_1:w_1");
  inst.unmount();
});

test("connection query pagination, triggering many times don't trigger many redraws", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let rlay,
    renders = 0;
  const World = connectData(
    ({ world, restlay }) => (
      (rlay = restlay), renders++, "" + world.edges.length
    ),
    {
      queries: { world: WorldQuery },
      initialVariables: { world: 2 },
      freezeTransition: true
    }
  );
  const inst = renderer.create(render(<World />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(renders).toBe(1);
  invariant(rlay, "restlay available");
  rlay.setVariables({ world: 2 });
  expect(net.tick()).toBe(0);
  await flushPromises();
  expect(renders).toBe(1);
  expect(inst.toJSON()).toBe("2");
  rlay.setVariables({ world: 50 });
  rlay.setVariables({ world: 50 });
  rlay.setVariables({ world: 50 });
  rlay.setVariables({ world: 50 });
  rlay.setVariables({ world: 50 });
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("50");
  expect(renders).toBe(2);
  rlay.setVariables({ world: 10 });
  rlay.setVariables({ world: 10 });
  rlay.setVariables({ world: 10 });
  rlay.setVariables({ world: 10 });
  expect(net.tick()).toBe(0);
  await flushPromises();
  expect(inst.toJSON()).toBe("10");
  expect(renders).toBe(3);
  inst.unmount();
});

test("when paginating a lot, server is allowed to return less result that requested but many queries will be triggered (current behavior of impl)", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let rlay,
    renders = 0;
  const World = connectData(
    ({ world, restlay }) => (
      (rlay = restlay), renders++, "" + world.edges.length
    ),
    {
      queries: { world: WorldQuery },
      initialVariables: { world: 2 },
      freezeTransition: true
    }
  );
  const inst = renderer.create(render(<World />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(renders).toBe(1);
  invariant(rlay, "restlay available");
  rlay.setVariables({ world: 2 });
  expect(net.tick()).toBe(0);
  await flushPromises();
  expect(renders).toBe(1);
  expect(inst.toJSON()).toBe("2");
  rlay.setVariables({ world: 1000 });
  for (let i = 0; i < 10; i++) {
    expect(net.tick()).toBe(1);
    await flushPromises();
  }
  expect(net.tick()).toBe(0);
  expect(inst.toJSON()).toBe("1000");
  inst.unmount();
});

test("unmounting a connection query will starts over", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let rlay;
  const World = connectData(
    ({ world, restlay }) => ((rlay = restlay), "" + world.edges.length),
    {
      queries: {
        world: WorldQuery
      },
      initialVariables: {
        world: 30
      }
    }
  );
  const inst = renderer.create(render(<World />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("30");
  inst.update(render(null));
  expect(inst.toJSON()).toBe(null);
  inst.update(render(<World />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("30");
  invariant(rlay, "restlay available");
  rlay.setVariables({ world: 50 });
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("50");
  inst.update(render(null));
  expect(inst.toJSON()).toBe(null);
  inst.update(render(<World />));
  expect(inst.toJSON()).toBe(null);
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("30");
  inst.unmount();
});
