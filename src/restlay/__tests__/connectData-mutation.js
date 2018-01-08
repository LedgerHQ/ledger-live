//@flow
import React from "react";
import invariant from "invariant";
import renderer from "react-test-renderer";
import connectData from "../connectData";
import { createRender, networkFromMock, flushPromises } from "../tests-utils";
import createMock, {
  AnimalsQuery,
  AddAnimalMutation,
  IncrementAgesMutation
} from "../tests-utils/mock-1";

test("restlay.commitMutation returns a promise of the expected result", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let rlay;
  const Whatever = connectData(({ restlay }) => ((rlay = restlay), null));
  const inst = renderer.create(render(<Whatever />));
  invariant(rlay, "restlay is defined");
  const p = rlay.commitMutation(
    new AddAnimalMutation({
      animal: {
        name: "foo",
        age: 42
      }
    })
  );
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(p).toBeInstanceOf(Promise);
  const res = await p;
  expect(res).toMatchObject({ name: "foo", age: 42 });
  expect(typeof res.id).toBe("string");
  inst.unmount();
});

test("restlay.commitMutation correctly redraw with new data", async () => {
  const net = networkFromMock(createMock());
  const render = createRender(net.network);
  let rlay;
  const Animals = connectData(
    ({ restlay, animals }) => (
      (rlay = restlay),
      "last=" +
        animals[animals.length - 1].name +
        "_" +
        animals[animals.length - 1].age
    ),
    {
      queries: { animals: AnimalsQuery }
    }
  );
  const inst = renderer.create(render(<Animals />));
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(inst.toJSON()).toBe("last=doge_5");
  invariant(rlay, "restlay is defined");
  const p = rlay.commitMutation(new IncrementAgesMutation());
  expect(net.tick()).toBe(1);
  await flushPromises();
  expect(p).toBeInstanceOf(Promise);
  const res = await p;
  expect(res.length).toBe(2);
  expect(inst.toJSON()).toBe("last=doge_6");
  inst.unmount();
});
