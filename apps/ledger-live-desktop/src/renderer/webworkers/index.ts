export async function initWorker(path: string) {
  let workerPath = path;
  if (!__DEV__) {
    // In development, rspack dev server serves the worker directly
    // In production, workers are bundled into separate files
    // The location of the file is ./[file].worker.js, so we need to rewrite the path
    workerPath = workerPath.split("/").slice(-1)[0];
    if (workerPath.endsWith(".ts")) {
      workerPath = workerPath.replace(".ts", ".worker.js");
    } else if (workerPath.endsWith(".js")) {
      workerPath = workerPath.replace(".js", ".worker.js");
    } else {
      workerPath = workerPath + ".worker.js";
    }
  }
  const worker = new Worker(workerPath, { type: "module" });
  return worker;
}
