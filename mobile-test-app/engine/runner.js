// @flow

export type Node = {
  name: string,
  status: "pending" | "running" | "failure" | "success" | "done",
  error: ?Error,
  children: Node[]
};

export type State = {
  tree: Node[],
  running: boolean
};

export const initialState: State = { tree: [], running: false };

const makeTree = nodes =>
  nodes.map(node => {
    return {
      name: node.name,
      status: "pending",
      error: null,
      children: makeTree(node.children)
    };
  });

const updatePath = (nodes, path, updater) => {
  if (path.length < 1) throw new Error("invalid path");
  const i = path[0];
  const node = nodes[i];
  if (!node) throw new Error("no node found in path");
  const newNodes = nodes.slice(0);
  if (path.length === 1) {
    newNodes[i] = updater(node);
  } else {
    newNodes[i] = {
      ...node,
      children: updatePath(node.children, path.slice(1), updater)
    };
  }
  return newNodes;
};

export const reducer = (state: State, action: *): State => {
  switch (action.type) {
    case "run-start":
      return {
        ...state,
        tree: updatePath(state.tree, action.path, n => ({
          ...n,
          status: "running"
        }))
      };
    case "run-done":
      return {
        ...state,
        tree: updatePath(state.tree, action.path, n => ({
          ...n,
          status: "done"
        }))
      };
    case "run-success":
      return {
        ...state,
        tree: updatePath(state.tree, action.path, n => ({
          ...n,
          status: "success"
        }))
      };
    case "run-failure":
      return {
        ...state,
        tree: updatePath(state.tree, action.path, n => ({
          ...n,
          status: "failure",
          error: action.error
        }))
      };
    case "begin":
      return { tree: makeTree(action.testFiles), running: true };
    case "finish":
      return { ...state, running: false };
    default:
      return state;
  }
};

const successMessage = (names = [], time) =>
  console.log(`✅ ${names.join(" > ")} SUCCESS in ${time}ms`);
const errorMessage = (names = [], error) => {
  console.log(`❌ ${names.join(" > ")} FAILED`);
  console.log(error.stack);
};

export const runTests = (testFiles: *, dispatch: *) => {
  async function rec(nodes, rootPath, rootNames) {
    for (let i = 0; i < nodes.length; i++) {
      const { children, beforeAll, testFunction, name } = nodes[i];
      const newNames = rootNames.concat([name]);
      const path = rootPath.concat([i]);
      dispatch({ type: "run-start", path });
      try {
        for (let j = 0; j < beforeAll.length; j++) {
          await beforeAll[j]();
        }
        if (testFunction) {
          const start = Date.now();
          await testFunction();
          const timeSpent = Date.now() - start;
          successMessage(newNames, timeSpent);
          dispatch({ type: "run-success", path });
        } else {
          await rec(children, path, newNames);
          dispatch({ type: "run-done", path });
        }
      } catch (error) {
        errorMessage(newNames, error);
        dispatch({ type: "run-failure", path, error });
      }
    }
  }
  return rec(testFiles, [], []);
};
