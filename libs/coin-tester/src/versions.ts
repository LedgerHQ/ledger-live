/**
 * The versions of a network's node and indexer, as the CI gives them to a coin tester: one variable per
 * network, `COIN_SANDBOX_<NETWORK>`, holding the flags of coin-sandbox's `up` (and of its `pull`), e.g.
 * `COIN_SANDBOX_ETHEREUM='--node geth@1.17.9 --indexer atlas@2.38.16'`. The workflow's matrix is the only place
 * the versions are written, and it pulls exactly what the scenarios then ask for.
 */

export type ComponentVersion = { implementation: string; version?: string };
export type SandboxVersions = {
  node: ComponentVersion & { version: string };
  indexer?: ComponentVersion;
};

const FLAGS = ["--node", "--indexer"];

export function sandboxVersionsVariable(network: string): string {
  return `COIN_SANDBOX_${network.toUpperCase()}`;
}

/** `implementation@version`, or `implementation` alone for a component built by coin-sandbox. */
function componentOf(spec: string, variable: string): ComponentVersion {
  const at = spec.indexOf("@");
  const implementation = at < 0 ? spec : spec.slice(0, at);
  const version = at < 0 ? undefined : spec.slice(at + 1);
  if (implementation === "" || version === "") {
    throw new Error(`${variable}: "${spec}" is not implementation@version`);
  }
  return version === undefined ? { implementation } : { implementation, version };
}

/**
 * The `node` and `indexer` params `startSandbox` takes for `network`, read from `COIN_SANDBOX_<NETWORK>`.
 * Nothing is defaulted: a missing or malformed variable is an error that names it.
 */
export function sandboxVersions(
  network: string,
  env: Record<string, string | undefined> = process.env,
): SandboxVersions {
  const variable = sandboxVersionsVariable(network);
  const text = env[variable];
  if (text === undefined || text.trim() === "") {
    throw new Error(
      `${variable} is not set: it holds the versions to run, e.g. ${variable}='--node implementation@version'`,
    );
  }
  const tokens = text.trim().split(/\s+/);
  const specs: Record<string, string> = {};
  for (let i = 0; i < tokens.length; i += 2) {
    const flag = tokens[i];
    const spec = tokens[i + 1];
    if (!FLAGS.includes(flag)) {
      throw new Error(`${variable}: unexpected "${flag}", only ${FLAGS.join(" and ")} are read`);
    }
    if (spec === undefined || FLAGS.includes(spec)) {
      throw new Error(`${variable}: ${flag} has no value`);
    }
    if (specs[flag] !== undefined) throw new Error(`${variable}: ${flag} is given twice`);
    specs[flag] = spec;
  }
  const nodeSpec = specs["--node"];
  if (nodeSpec === undefined) throw new Error(`${variable}: --node is required`);
  const node = componentOf(nodeSpec, variable);
  if (node.version === undefined) throw new Error(`${variable}: --node needs a version`);
  const indexerSpec = specs["--indexer"];
  return {
    node: { implementation: node.implementation, version: node.version },
    ...(indexerSpec === undefined ? {} : { indexer: componentOf(indexerSpec, variable) }),
  };
}
