//! Freeze-list exclusion proof construction.
//!
//! Private stablecoin transfers (`transfer_private`, `transfer_private_to_public`) require a
//! freeze-list **exclusion proof**: a `[MerkleProof; 2]` proving the sender is not on the
//! on-chain freeze list. This module fetches the freeze list from the node and builds that
//! proof, reproducing the `@provablehq/sdk` `SealanceMerkleTree`.

use std::str::FromStr;

use anyhow::Context;
use snarkvm::console::network::Network;
use snarkvm::console::program::{Plaintext, ToField, ToFields};
use snarkvm::console::types::{Address, Field};
use snarkvm::prelude::Zero;

use crate::AppResult;
use crate::error::AppError;

/// `MerkleProof.siblings` length on-chain (`[field; 16]`), also the sibling-path depth. The
/// path is the real climb up the (small) tree, zero-padded out to this many entries.
const SIBLINGS: usize = 16;

/// `generateLeaves` default max depth. Capacity is `2^(MAX_TREE_DEPTH - 1)` leaves.
const MAX_TREE_DEPTH: u32 = 15;

/// Raw freeze-list snapshot read from the node.
#[derive(Debug, Clone)]
pub struct FreezeListSnapshot {
  /// Frozen addresses, in on-chain index order (`freeze_list_index[0..=last]`).
  pub addresses: Vec<String>,
  /// Current root literal, `freeze_list_root[1u8]` (e.g. `"...field"`).
  pub root: String,
}

/// Map a stablecoin program to its freeze-list program (`usdcx_stablecoin.aleo` ->
/// `usdcx_freezelist.aleo`).
pub fn freezelist_program_for(stablecoin_program: &str) -> AppResult<String> {
  match stablecoin_program {
    "usdcx_stablecoin.aleo" => Ok("usdcx_freezelist.aleo".to_string()),
    "test_usdcx_stablecoin.aleo" => Ok("test_usdcx_freezelist.aleo".to_string()),
    "usad_stablecoin.aleo" => Ok("usad_freezelist.aleo".to_string()),
    "test_usad_stablecoin.aleo" => Ok("test_usad_freezelist.aleo".to_string()),
    other => Err(AppError::InvalidIntent(format!(
      "No freeze list known for program '{}'",
      other
    ))),
  }
}

/// Fetch the freeze list from the node: `freeze_list_last_index`, every
/// `freeze_list_index[i]`, and `freeze_list_root[1u8]`.
///
/// `node_base` is the API base up to (and including) the network segment, e.g.
/// `https://api.provable.com/v2/mainnet`
pub async fn fetch_freeze_list(
  node_base: &str,
  freezelist_program: &str,
) -> AppResult<FreezeListSnapshot> {
  let client = reqwest::Client::new();
  let base = node_base.trim_end_matches('/');

  let last_index_raw = get_mapping_value(
    &client,
    base,
    freezelist_program,
    "freeze_list_last_index",
    "true",
  )
  .await?;

  let mut addresses = Vec::new();
  if let Some(last_raw) = last_index_raw {
    let last: u32 = last_raw
      .trim_end_matches("u32")
      .parse()
      .with_context(|| format!("Bad freeze_list_last_index '{last_raw}'"))?;
    // sequential fetch; freeze lists are tiny today. Parallelize with
    // futures::join_all if the list ever grows large enough to matter.
    for i in 0..=last {
      // None results are silently ignored on purpose
      if let Some(addr) = get_mapping_value(
        &client,
        base,
        freezelist_program,
        "freeze_list_index",
        &format!("{i}u32"),
      )
      .await?
      {
        addresses.push(addr);
      }
    }
  }

  let root = get_mapping_value(&client, base, freezelist_program, "freeze_list_root", "1u8")
    .await?
    .with_context(|| format!("freeze_list_root[1u8] is empty on {freezelist_program}"))?;

  Ok(FreezeListSnapshot { addresses, root })
}

/// GET `<base>/program/<program>/mapping/<name>/<key>`, returning the value or `None` if the
/// mapping has no entry for the key (node returns JSON `null`).
/// https://docs.provable.com/docs/api/v2/get-explorer-programs-mapping-value
async fn get_mapping_value(
  client: &reqwest::Client,
  base: &str,
  program: &str,
  mapping: &str,
  key: &str,
) -> AppResult<Option<String>> {
  let url = format!("{base}/program/{program}/mapping/{mapping}/{key}");
  let resp = client
    .get(&url)
    .send()
    .await
    .with_context(|| format!("Freeze-list fetch failed ({url})"))?;
  if !resp.status().is_success() {
    return Err(AppError::InternalServerError(anyhow::anyhow!(
      "Freeze-list fetch {url} returned HTTP {}",
      resp.status()
    )));
  }
  // The node returns the mapping value JSON-encoded as a string, or `null` when absent.
  Ok(
    resp
      .json::<Option<String>>()
      .await
      .with_context(|| format!("Bad freeze-list response ({url})"))?,
  )
}

// ---- Pure Merkle construction (mirrors SealanceMerkleTree; fully unit-tested) ----

/// Leaf value for an address: its field element (group x-coordinate). Equals the Leo
/// `cast <addr> into field` the on-chain verifier asserts against `siblings[0]`.
fn leaf_of<N: Network>(addr: &Address<N>) -> AppResult<Field<N>> {
  Ok(addr.to_field().context("address->field failed")?)
}

/// Hash a tree node, mirroring `SealanceMerkleTree.hashTwoElements` and the on-chain
/// `hash.psd4 [field; 3] into field`: build the `[prefix, left, right]` array plaintext and
/// hash its field-encoding (`to_fields()`).
fn hash_node<N: Network>(prefix: Field<N>, left: Field<N>, right: Field<N>) -> AppResult<Field<N>> {
  let array = Plaintext::<N>::from_str(&format!("[{prefix},{left},{right}]"))
    .context("build [field; 3] plaintext")?;
  let fields = array.to_fields().context("array to_fields")?;
  Ok(N::hash_psd4(&fields).context("hash_psd4 failed")?)
}

/// Smallest power of two `>= n`, with a floor of 2 (matching `generateLeaves`).
fn num_leaves_for(n: usize) -> usize {
  if n <= 1 { 2 } else { n.next_power_of_two() }
}

/// Convert addresses to sorted, zero-padded leaf fields, mirroring `generateLeaves`:
/// drop the zero address, sort ascending, then **prepend** `0field` padding to a power of two.
pub fn generate_leaves<N: Network>(addrs: &[Address<N>]) -> AppResult<Vec<Field<N>>> {
  let zero = Field::<N>::zero();
  let mut fields: Vec<Field<N>> = addrs
    .iter()
    .map(leaf_of)
    .collect::<AppResult<Vec<_>>>()?
    .into_iter()
    .filter(|f| *f != zero)
    .collect();

  let max_leaves = 2usize.pow(MAX_TREE_DEPTH - 1);
  if fields.len() > max_leaves {
    return Err(AppError::InvalidIntent(format!(
      "Freeze list too large: {} entries, max {}",
      fields.len(),
      max_leaves
    )));
  }

  let num_leaves = num_leaves_for(fields.len());
  fields.sort();

  let mut leaves = vec![zero; num_leaves - fields.len()];
  leaves.extend(fields);
  Ok(leaves)
}

/// Build the flat Merkle tree `[leaves..., level1..., ..., root]`. Leaf-level pairs hash with
/// the `1field` prefix, higher levels with `0field`.
fn build_tree<N: Network>(leaves: &[Field<N>]) -> AppResult<Vec<Field<N>>> {
  if leaves.is_empty() || !leaves.len().is_multiple_of(2) {
    return Err(AppError::InternalServerError(anyhow::anyhow!(
      "Merkle tree needs an even, non-zero number of leaves, got {}",
      leaves.len()
    )));
  }
  let one = Field::<N>::from_str("1field").expect("1field is a valid constant");
  let zero = Field::<N>::zero();

  let leaf_count = leaves.len();
  let mut tree = leaves.to_vec();
  let mut current = leaves.to_vec();
  while current.len() > 1 {
    let prefix = if current.len() == leaf_count {
      one
    } else {
      zero
    };
    let mut next = Vec::with_capacity(current.len() / 2);
    for pair in current.chunks(2) {
      next.push(hash_node(prefix, pair[0], pair[1])?);
    }
    tree.extend(next.iter().copied());
    current = next;
  }
  Ok(tree)
}

/// The two adjacent sorted leaf indices bracketing `sender` (mirrors `getLeafIndices`, no
/// frozen guard): `right` is the first leaf `>= sender`; `left = right - 1`.
fn leaf_indices<N: Network>(leaves: &[Field<N>], sender: Field<N>) -> (usize, usize) {
  match leaves.iter().position(|leaf| sender <= *leaf) {
    None => (leaves.len() - 1, leaves.len() - 1), // sender greater than all leaves
    Some(0) => (0, 0),                            // sender at/below the first leaf
    Some(right) => (right - 1, right),
  }
}

/// Sibling path for `leaf_index`: the leaf, then one sibling per real level climbed, then
/// zero-padded to `depth` entries (mirrors `getSiblingPath`). Returns `(siblings, leaf_index)`.
fn sibling_path<N: Network>(
  tree: &[Field<N>],
  num_leaves: usize,
  leaf_index: usize,
  depth: usize,
) -> (Vec<Field<N>>, u32) {
  let zero = Field::<N>::zero();
  let mut path = vec![tree[leaf_index]];
  let mut index = leaf_index;
  let mut parent_index = num_leaves;
  let mut level = 1usize;
  while parent_index < tree.len() {
    let sibling_index = if index.is_multiple_of(2) {
      index + 1
    } else {
      index - 1
    };
    path.push(tree[sibling_index]);
    index = parent_index + leaf_index / 2usize.pow(level as u32);
    parent_index += num_leaves / 2usize.pow(level as u32);
    level += 1;
  }
  while level < depth {
    path.push(zero);
    level += 1;
  }
  (path, leaf_index as u32)
}

/// Format `[MerkleProof; 2]` as the Leo literal the transition expects (matches
/// `formatMerkleProof`): `[{siblings: [..16..], leaf_index: Nu32}, {..}]`.
fn format_merkle_proof<N: Network>(proofs: &[(Vec<Field<N>>, u32); 2]) -> String {
  let one = |p: &(Vec<Field<N>>, u32)| {
    let siblings = p
      .0
      .iter()
      .map(|f| f.to_string())
      .collect::<Vec<_>>()
      .join(", ");
    format!("{{siblings: [{}], leaf_index: {}u32}}", siblings, p.1)
  };
  format!("[{}, {}]", one(&proofs[0]), one(&proofs[1]))
}

/// Build the full freeze-list exclusion proof for `sender`. Returns the `[MerkleProof; 2]`
/// literal and the locally-recomputed root. Errors if `sender` is on the list (the proof would
/// be invalid by construction even though the root still matches).
pub fn build_exclusion_proof<N: Network>(
  addrs: &[Address<N>],
  sender: &Address<N>,
) -> AppResult<(String, Field<N>)> {
  let leaves = generate_leaves(addrs)?;
  let sender_field = leaf_of(sender)?;

  if leaves.contains(&sender_field) {
    return Err(AppError::InvalidIntent(
      "Sender is on the freeze list; transfer not allowed".to_string(),
    ));
  }

  let tree = build_tree(&leaves)?;
  let root = *tree.last().expect("non-empty tree");
  let num_leaves = leaves.len();
  let (left, right) = leaf_indices(&leaves, sender_field);

  let proofs = [
    sibling_path(&tree, num_leaves, left, SIBLINGS),
    sibling_path(&tree, num_leaves, right, SIBLINGS),
  ];
  Ok((format_merkle_proof(&proofs), root))
}

#[cfg(test)]
mod tests {
  use super::*;
  use snarkvm::prelude::MainnetV0;

  type N = MainnetV0;

  // The two example addresses from the SDK tests and their field (x-coordinate) values.
  const ADDR_SMALL: &str = "aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t";
  const FIELD_SMALL: &str =
    "1295133970529764960316948294624974168921228814652993007266766481909235735940field";
  const ADDR_LARGE: &str = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
  const FIELD_LARGE: &str =
    "3501665755452795161867664882580888971213780722176652848275908626939553697821field";
  const ZERO_ADDR: &str = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc";

  fn field(s: &str) -> Field<N> {
    Field::<N>::from_str(s).unwrap()
  }
  fn addr(s: &str) -> Address<N> {
    Address::<N>::from_str(s).unwrap()
  }

  /// #1 Leaf cast: snarkvm `Address::to_field` == the SDK x-coordinate decimals == Leo `cast`.
  #[test]
  fn leaf_cast_matches_sdk() {
    assert_eq!(leaf_of(&addr(ADDR_SMALL)).unwrap().to_string(), FIELD_SMALL);
    assert_eq!(leaf_of(&addr(ADDR_LARGE)).unwrap().to_string(), FIELD_LARGE);
  }

  /// #2 Leaf-pair hash: `psd4([1field, 3field, 4field])` from the SDK 4-leaf tree vector.
  #[test]
  fn leaf_pair_hash_matches_sdk() {
    let h = hash_node(field("1field"), field("3field"), field("4field")).unwrap();
    assert_eq!(
      h.to_string(),
      "4560646903308595113151029585344265575242682454899063992850623350939538444867field"
    );
  }

  /// #3 Golden on-chain root: empty list -> two `0field` leaves -> the exact constant
  /// `usdcx_freezelist.aleo` `initialize` writes to `freeze_list_root[1u8]`. Pins
  /// `hash_psd4` == VM `hash.psd4` and the `1field` leaf separator.
  #[test]
  fn golden_root_for_empty_list() {
    let leaves = generate_leaves::<N>(&[]).unwrap();
    assert_eq!(leaves, vec![Field::<N>::zero(), Field::<N>::zero()]);
    let tree = build_tree(&leaves).unwrap();
    assert_eq!(
      tree.last().unwrap().to_string(),
      "3642222252059314292809609689035560016959342421640560347114299934615987159853field"
    );
  }

  /// `generateLeaves` sorts ascending, drops the zero address, and prepends `0field` padding.
  #[test]
  fn generate_leaves_sorts_filters_and_pads() {
    // Two addresses, no padding: sorted ascending.
    let leaves = generate_leaves::<N>(&[addr(ADDR_LARGE), addr(ADDR_SMALL)]).unwrap();
    assert_eq!(
      leaves.iter().map(|f| f.to_string()).collect::<Vec<_>>(),
      vec![FIELD_SMALL.to_string(), FIELD_LARGE.to_string()]
    );
    // Zero address dropped, one real -> [0field, real] (SDK test vector).
    let leaves = generate_leaves::<N>(&[addr(ZERO_ADDR), addr(ADDR_LARGE)]).unwrap();
    assert_eq!(
      leaves.iter().map(|f| f.to_string()).collect::<Vec<_>>(),
      vec!["0field".to_string(), FIELD_LARGE.to_string()]
    );
  }

  // The 7-node tree from the SDK `formatMerkleProof` test vector.
  fn sdk_seven_node_tree() -> Vec<Field<N>> {
    [
      "0",
      "3501665755452795161867664882580888971213780722176652848275908626939553697821",
      "4539470720491009302557179633742244202521723448302096289013203539461297095738",
      "7426353931016374702593127301815460123689343416970811802742952620156952318730",
      "7052697765310872540032307615262912043079143561812812402660738198777516992718",
      "7162588494104628985065247846816902886874444240334527780589295712502521092900",
      "7179654795269183001911849426990084952297107287660910339902947270666145459461",
    ]
    .iter()
    .map(|s| field(&format!("{s}field")))
    .collect()
  }

  /// #4 End-to-end, verbatim against the SDK golden string at depth 15, then depth 16 == the
  /// depth-15 result with exactly one more trailing `0field` per proof (no hand-editing).
  #[test]
  fn format_matches_sdk_golden_and_depth16_extends_it() {
    let tree = sdk_seven_node_tree();
    let num_leaves = 4;
    let leaves = &tree[..num_leaves];

    // Pin the multi-level build (prefix flip 1field->0field, flat layout sibling_path relies
    // on) against the reference tree: building from its 4 leaves must reproduce it exactly.
    assert_eq!(build_tree(leaves).unwrap(), tree);

    let sender = leaf_of(&addr(ADDR_LARGE)).unwrap(); // 3501...821 == leaves[1]
    assert_eq!(leaf_indices(leaves, sender), (0, 1));

    let p0_15 = sibling_path(&tree, num_leaves, 0, 15);
    let p1_15 = sibling_path(&tree, num_leaves, 1, 15);
    let golden = "[{siblings: [0field, 3501665755452795161867664882580888971213780722176652848275908626939553697821field, 7162588494104628985065247846816902886874444240334527780589295712502521092900field, 0field, 0field, 0field, 0field, 0field, 0field, 0field, 0field, 0field, 0field, 0field, 0field], leaf_index: 0u32}, {siblings: [3501665755452795161867664882580888971213780722176652848275908626939553697821field, 0field, 7162588494104628985065247846816902886874444240334527780589295712502521092900field, 0field, 0field, 0field, 0field, 0field, 0field, 0field, 0field, 0field, 0field, 0field, 0field], leaf_index: 1u32}]";
    assert_eq!(format_merkle_proof(&[p0_15.clone(), p1_15.clone()]), golden);

    // Depth 16 = depth 15 + one more trailing 0field per proof.
    let p0_16 = sibling_path(&tree, num_leaves, 0, 16);
    let p1_16 = sibling_path(&tree, num_leaves, 1, 16);
    assert_eq!(p0_16.0.len(), 16);
    assert_eq!(p1_16.0.len(), 16);
    let mut expect0 = p0_15.0.clone();
    expect0.push(Field::<N>::zero());
    assert_eq!(p0_16.0, expect0);
  }

  /// #5 Bracket edge cases on a `[0field, real]` tree (mirrors SDK `getLeafIndices`).
  #[test]
  fn bracket_edge_cases() {
    let leaves = generate_leaves::<N>(&[addr(ADDR_LARGE)]).unwrap(); // [0field, 3501...821]
    // Interior: 0 < sender < 3501...821 -> brackets (0, 1).
    assert_eq!(leaf_indices(&leaves, field(FIELD_SMALL)), (0, 1));
    // After-last: sender greater than every leaf -> (last, last).
    let bigger =
      field("4111111111111111111111111111111111111111111111111111111111111111111111111111field");
    assert_eq!(leaf_indices(&leaves, bigger), (1, 1));

    // Before-first: an exact-power-of-two list has no 0field padding, so leaves[0] is a real
    // address; a sender below it returns (0, 0).
    let pow2 = generate_leaves::<N>(&[addr(ADDR_SMALL), addr(ADDR_LARGE)]).unwrap();
    assert_ne!(pow2[0], Field::<N>::zero());
    assert_eq!(leaf_indices(&pow2, field("1field")), (0, 0));
  }

  /// #6 A sender on the list is rejected; a sender not on it yields a valid 16-sibling proof
  /// whose root matches `build_tree`.
  #[test]
  fn frozen_sender_rejected_and_happy_path() {
    // Frozen: sender is one of the listed addresses.
    let res = build_exclusion_proof(&[addr(ADDR_LARGE), addr(ADDR_SMALL)], &addr(ADDR_LARGE));
    assert!(res.is_err());

    // Happy path: sender (ADDR_LARGE) not on a list containing only ADDR_SMALL.
    let (proof, root) = build_exclusion_proof(&[addr(ADDR_SMALL)], &addr(ADDR_LARGE)).unwrap();
    assert!(proof.starts_with('[') && proof.contains("leaf_index:"));
    let expected_root = *build_tree(&generate_leaves::<N>(&[addr(ADDR_SMALL)]).unwrap())
      .unwrap()
      .last()
      .unwrap();
    assert_eq!(root, expected_root);
    // The proof must parse as a snarkvm Value of the on-chain type.
    snarkvm::console::program::Value::<N>::from_str(&proof).expect("proof literal parses");
  }
}
