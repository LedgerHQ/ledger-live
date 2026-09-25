//! Intent processing service for creating prepared requests
//!
//! Converts high-level user intents (like "transfer 1000 credits to address X")
//! into prepared requests that can be signed by a hardware wallet.

use std::collections::HashMap;
use std::str::FromStr;

use super::types::PreparedRequest;
use crate::AppResult;
use crate::core::intent_utils::compute_program_checksum;
use crate::error::AppError;
use crate::routes::intent::RecordContent;
use snarkvm::console::network::{Network, TestnetV0};
use snarkvm::console::program::{Identifier, Literal, ProgramID, Value, ValueType};
use snarkvm::console::types::{Address, Field, Group, U8, U64, U128};
use snarkvm::prelude::{Entry, Owner, Plaintext, Record};

/// The credits.aleo program ID
pub(crate) const CREDITS_PROGRAM: &str = "credits.aleo";

pub(crate) const LDGBATCHER_28_PROGRAM: &str = "ldg_p_28.aleo";
pub(crate) const LDGBATCHER_910_PROGRAM: &str = "ldg_p_910.aleo";
pub(crate) const LDGBATCHER_1114_PROGRAM: &str = "ldg_p_1114.aleo";

pub(crate) const LDGBATCHER_PPUB_28_PROGRAM: &str = "ldg_p2p_28.aleo";
pub(crate) const LDGBATCHER_PPUB_910_PROGRAM: &str = "ldg_p2p_910.aleo";
pub(crate) const LDGBATCHER_PPUB_1114_PROGRAM: &str = "ldg_p2p_1114.aleo";

/// Standalone stablecoin programs. The token is identified by which program is called
/// (these contracts take no `token_id`), so transfers are routed by program ID.
pub(crate) const USAD_STABLECOIN_PROGRAM: &str = "usad_stablecoin.aleo";
/// Testnet usad is deployed under a `test_`-prefixed program ID.
pub(crate) const TEST_USAD_STABLECOIN_PROGRAM: &str = "test_usad_stablecoin.aleo";
pub(crate) const USDCX_STABLECOIN_PROGRAM: &str = "usdcx_stablecoin.aleo";
/// Testnet usdcx is deployed under a `test_`-prefixed program ID.
pub(crate) const TEST_USDCX_STABLECOIN_PROGRAM: &str = "test_usdcx_stablecoin.aleo";

/// Programs whose public token transfers we support. A request's `program_id` must be one of these.
pub(crate) const STABLECOIN_PROGRAMS: [&str; 4] = [
  USAD_STABLECOIN_PROGRAM,
  TEST_USAD_STABLECOIN_PROGRAM,
  USDCX_STABLECOIN_PROGRAM,
  TEST_USDCX_STABLECOIN_PROGRAM,
];

// Batch transfer programs ("batchers"). Each joins N `Token` records and performs a single
// `transfer_private` / `transfer_private_to_public`, proving freeze-list exclusion once for the batch.
// The program ID is the SAME on testnet and mainnet; only the embedded source differs (testnet
// imports the `test_`-prefixed stablecoin), so the source is selected by network in
// `fetch_batcher_source`.
pub(crate) const USDCX_BATCHER_P_28_PROGRAM: &str = "ldg_usdcx_p_28.aleo";
pub(crate) const USDCX_BATCHER_P_910_PROGRAM: &str = "ldg_usdcx_p_910.aleo";
pub(crate) const USDCX_BATCHER_P_1113_PROGRAM: &str = "ldg_usdcx_p_1113.aleo";
pub(crate) const USDCX_BATCHER_P2P_28_PROGRAM: &str = "ldg_usdcx_p2p_28.aleo";
pub(crate) const USDCX_BATCHER_P2P_910_PROGRAM: &str = "ldg_usdcx_p2p_910.aleo";
pub(crate) const USDCX_BATCHER_P2P_1113_PROGRAM: &str = "ldg_usdcx_p2p_1113.aleo";

pub(crate) const USAD_BATCHER_P_28_PROGRAM: &str = "ldg_usad_p_28.aleo";
pub(crate) const USAD_BATCHER_P_910_PROGRAM: &str = "ldg_usad_p_910.aleo";
pub(crate) const USAD_BATCHER_P_1113_PROGRAM: &str = "ldg_usad_p_1113.aleo";
pub(crate) const USAD_BATCHER_P2P_28_PROGRAM: &str = "ldg_usad_p2p_28.aleo";
pub(crate) const USAD_BATCHER_P2P_910_PROGRAM: &str = "ldg_usad_p2p_910.aleo";
pub(crate) const USAD_BATCHER_P2P_1113_PROGRAM: &str = "ldg_usad_p2p_1113.aleo";

/// Maximum records in a single stablecoin batch (the `_1113` batcher tops out at 13).
pub(crate) const MAX_TOKEN_BATCH_RECORDS: usize = 13;

/// Validate that `program_id` is a supported stablecoin program, returning it on success.
fn validate_stablecoin_program(program_id: &str) -> AppResult<&str> {
  if STABLECOIN_PROGRAMS.contains(&program_id) {
    Ok(program_id)
  } else {
    Err(AppError::InvalidIntent(format!(
      "Unsupported stablecoin program: '{}'",
      program_id
    )))
  }
}

fn fetch_program_source_by_id(program_id: &str) -> AppResult<&'static str> {
  match program_id {
    LDGBATCHER_PPUB_28_PROGRAM => Ok(include_str!("../../contracts/ldg_p2p_28.aleo")),
    LDGBATCHER_PPUB_910_PROGRAM => Ok(include_str!("../../contracts/ldg_p2p_910.aleo")),
    LDGBATCHER_PPUB_1114_PROGRAM => Ok(include_str!("../../contracts/ldg_p2p_1114.aleo")),
    LDGBATCHER_28_PROGRAM => Ok(include_str!("../../contracts/ldg_p_28.aleo")),
    LDGBATCHER_910_PROGRAM => Ok(include_str!("../../contracts/ldg_p_910.aleo")),
    LDGBATCHER_1114_PROGRAM => Ok(include_str!("../../contracts/ldg_p_1114.aleo")),
    USAD_STABLECOIN_PROGRAM => Ok(include_str!("../../contracts/usad_stablecoin.aleo")),
    TEST_USAD_STABLECOIN_PROGRAM => Ok(include_str!("../../contracts/test_usad_stablecoin.aleo")),
    USDCX_STABLECOIN_PROGRAM => Ok(include_str!("../../contracts/usdcx_stablecoin.aleo")),
    TEST_USDCX_STABLECOIN_PROGRAM => Ok(include_str!("../../contracts/test_usdcx_stablecoin.aleo")),
    _ => Err(AppError::InvalidIntent("Program ID not found".into())),
  }
}

/// Fetch the bytecode source for a usdcx batcher program. Batchers share a program ID across
/// networks but differ in source (testnet imports the `test_`-prefixed stablecoin), so the file is
/// selected by the network type parameter. Required for computing the network-specific
/// `program_checksum`.
fn fetch_batcher_source<N: Network>(program_id: &str) -> AppResult<&'static str> {
  let testnet = N::ID == TestnetV0::ID;
  let src = match (program_id, testnet) {
    (USDCX_BATCHER_P_28_PROGRAM, true) => include_str!("../../contracts/test_ldg_usdcx_p_28.aleo"),
    (USDCX_BATCHER_P_28_PROGRAM, false) => include_str!("../../contracts/ldg_usdcx_p_28.aleo"),
    (USDCX_BATCHER_P_910_PROGRAM, true) => {
      include_str!("../../contracts/test_ldg_usdcx_p_910.aleo")
    }
    (USDCX_BATCHER_P_910_PROGRAM, false) => include_str!("../../contracts/ldg_usdcx_p_910.aleo"),
    (USDCX_BATCHER_P_1113_PROGRAM, true) => {
      include_str!("../../contracts/test_ldg_usdcx_p_1113.aleo")
    }
    (USDCX_BATCHER_P_1113_PROGRAM, false) => {
      include_str!("../../contracts/ldg_usdcx_p_1113.aleo")
    }
    (USDCX_BATCHER_P2P_28_PROGRAM, true) => {
      include_str!("../../contracts/test_ldg_usdcx_p2p_28.aleo")
    }
    (USDCX_BATCHER_P2P_28_PROGRAM, false) => {
      include_str!("../../contracts/ldg_usdcx_p2p_28.aleo")
    }
    (USDCX_BATCHER_P2P_910_PROGRAM, true) => {
      include_str!("../../contracts/test_ldg_usdcx_p2p_910.aleo")
    }
    (USDCX_BATCHER_P2P_910_PROGRAM, false) => {
      include_str!("../../contracts/ldg_usdcx_p2p_910.aleo")
    }
    (USDCX_BATCHER_P2P_1113_PROGRAM, true) => {
      include_str!("../../contracts/test_ldg_usdcx_p2p_1113.aleo")
    }
    (USDCX_BATCHER_P2P_1113_PROGRAM, false) => {
      include_str!("../../contracts/ldg_usdcx_p2p_1113.aleo")
    }
    (USAD_BATCHER_P_28_PROGRAM, true) => include_str!("../../contracts/test_ldg_usad_p_28.aleo"),
    (USAD_BATCHER_P_28_PROGRAM, false) => include_str!("../../contracts/ldg_usad_p_28.aleo"),
    (USAD_BATCHER_P_910_PROGRAM, true) => {
      include_str!("../../contracts/test_ldg_usad_p_910.aleo")
    }
    (USAD_BATCHER_P_910_PROGRAM, false) => include_str!("../../contracts/ldg_usad_p_910.aleo"),
    (USAD_BATCHER_P_1113_PROGRAM, true) => {
      include_str!("../../contracts/test_ldg_usad_p_1113.aleo")
    }
    (USAD_BATCHER_P_1113_PROGRAM, false) => {
      include_str!("../../contracts/ldg_usad_p_1113.aleo")
    }
    (USAD_BATCHER_P2P_28_PROGRAM, true) => {
      include_str!("../../contracts/test_ldg_usad_p2p_28.aleo")
    }
    (USAD_BATCHER_P2P_28_PROGRAM, false) => {
      include_str!("../../contracts/ldg_usad_p2p_28.aleo")
    }
    (USAD_BATCHER_P2P_910_PROGRAM, true) => {
      include_str!("../../contracts/test_ldg_usad_p2p_910.aleo")
    }
    (USAD_BATCHER_P2P_910_PROGRAM, false) => {
      include_str!("../../contracts/ldg_usad_p2p_910.aleo")
    }
    (USAD_BATCHER_P2P_1113_PROGRAM, true) => {
      include_str!("../../contracts/test_ldg_usad_p2p_1113.aleo")
    }
    (USAD_BATCHER_P2P_1113_PROGRAM, false) => {
      include_str!("../../contracts/ldg_usad_p2p_1113.aleo")
    }
    _ => {
      return Err(AppError::InvalidIntent(format!(
        "Batcher program source not found: {program_id}"
      )));
    }
  };
  Ok(src)
}

fn record_content_to_record<N: Network>(
  content: &RecordContent,
) -> AppResult<Record<N, Plaintext<N>>> {
  let owner_entry = Entry::<N, Plaintext<N>>::from_str(&content.owner)
    .map_err(|e| AppError::InvalidRecord(format!("Invalid record owner: {}", e)))?;

  let owner = match owner_entry {
    Entry::Public(Plaintext::Literal(Literal::Address(address), ..)) => Owner::Public(address),
    Entry::Private(plaintext) => Owner::Private(plaintext),
    _ => {
      return Err(AppError::InvalidRecord(
        "Invalid record owner: must be an address with valid visibility".to_string(),
      ));
    }
  };

  let mut data = indexmap::IndexMap::new();
  for (key, value) in content.data.clone() {
    let identifier = Identifier::<N>::from_str(&key)
      .map_err(|e| AppError::InvalidRecord(format!("Invalid record data key '{}': {}", key, e)))?;
    let entry = Entry::<N, Plaintext<N>>::from_str(&value).map_err(|e| {
      AppError::InvalidRecord(format!("Invalid record data value '{}': {}", value, e))
    })?;
    data.insert(identifier, entry);
  }

  let nonce = Group::<N>::from_str(&content.nonce)
    .map_err(|e| AppError::InvalidRecord(format!("Invalid record nonce: {}", e)))?;

  Record::<N, Plaintext<N>>::from_plaintext(owner, data, nonce, U8::new(content.version))
    .map_err(|e| AppError::InvalidRecord(format!("Failed to create record from parts: {}", e)))
}

/// Derive the nonce of the output record produced by `credits.aleo/join` given
/// the call's TVK.  The join function outputs register r3; snarkVM computes:
///   randomizer = HashToScalar_psd2(tvk || 3u64)
///   nonce      = randomizer * G
fn derive_join_output_nonce<N: Network>(tvk: Field<N>) -> AppResult<Group<N>> {
  let idx = Field::<N>::from_u64(3u64);
  let randomizer = N::hash_to_scalar_psd2(&[tvk, idx])
    .map_err(|e| AppError::BadRequest(format!("Failed to derive join output nonce: {}", e)))?;
  Ok(N::g_scalar_multiply(&randomizer))
}

/// Extract the `microcredits` u64 value from a credits.record.
fn extract_microcredits<N: Network>(record: &Record<N, Plaintext<N>>) -> AppResult<u64> {
  let key = Identifier::<N>::from_str("microcredits")
    .map_err(|e| AppError::InvalidRecord(format!("Invalid identifier: {}", e)))?;

  let entry = record
    .data()
    .get(&key)
    .ok_or_else(|| AppError::InvalidRecord("Record has no microcredits field".to_string()))?;

  let literal = match entry {
    Entry::Constant(Plaintext::Literal(lit, _))
    | Entry::Public(Plaintext::Literal(lit, _))
    | Entry::Private(Plaintext::Literal(lit, _)) => lit,
    _ => {
      return Err(AppError::InvalidRecord(
        "Unexpected microcredits entry type".to_string(),
      ));
    }
  };

  match literal {
    Literal::U64(v) => Ok(**v),
    _ => Err(AppError::InvalidRecord(
      "Expected U64 microcredits literal".to_string(),
    )),
  }
}

/// Maximum number of transitions the device can sign in a single session
/// (31 nested/root transitions + 1 fee transition), per ADR005. The host
/// derives one TVK per transition via the `GET_TVK` APDU, so the supplied TVK
/// array can never exceed this bound.
pub(crate) const MAX_SESSION_TRANSITIONS: usize = 32;

/// Build the merged `credits.record` that `credits.aleo/join` would produce.
/// The nonce is derived from the host-supplied TVK of the corresponding join
/// transition, so the server can construct this record before the hardware
/// wallet has signed — without ever knowing the on-device nonce material.
fn build_merged_record<N: Network>(
  signer_address: &Address<N>,
  total_mc: u64,
  nonce: Group<N>,
) -> AppResult<Record<N, Plaintext<N>>> {
  let mut data = HashMap::new();
  data.insert(
    "microcredits".to_string(),
    format!("{}u64.private", total_mc),
  );
  let content = RecordContent {
    owner: format!("{}.private", signer_address),
    data,
    nonce: nonce.to_string(),
    version: 1,
  };
  record_content_to_record(&content)
}

/// Build the nested call list for a batcher transfer function:
///   (N-1) × credits.aleo/join  +  1 × credits.aleo/<transfer_fn_name>
///
/// Nonce material is generated on-device (ADR005): the host calls `GET_TVK` for
/// every transition and forwards the resulting TVK array. The transitions in a
/// batcher session are ordered as `[root, join_1, ..., join_{N-1}, transfer]`,
/// so `tvks[i]` is the TVK of the i-th nested transition (the batcher root is
/// index 0). Each join transition `i` produces a merged record whose
/// `_nonce = HashToScalar(tvks[i], idx) * G`, which we consume here. The
/// server never sees the underlying nonce `r`.
#[allow(clippy::too_many_arguments)]
fn build_join_transfer_nested_calls<N: Network>(
  network_id: u16,
  amount: u64,
  parsed_records: &[Record<N, Plaintext<N>>],
  signer_address: &Address<N>,
  tvks: &[Field<N>],
  transfer_fn_name: &str,
  recipient: Address<N>,
  addr_type: &str,
  amount_type: &str,
) -> AppResult<Vec<PreparedRequest<N>>> {
  let n = parsed_records.len();

  // The host derives one TVK per transition in this bundle and forwards them in
  // signing-session order: `[root, join_1, ..., join_{n-1}, transfer]` — exactly
  // `n + 1` TVKs (the fee transition is a separate request). Require the exact
  // count so a malformed host request fails fast instead of silently dropping or
  // misaligning TVKs.
  let expected_tvks = n + 1;
  if tvks.len() != expected_tvks {
    return Err(AppError::BadRequest(format!(
      "Unexpected number of TVKs: expected {} (one per transition in [root, joins..., transfer]), got {}",
      expected_tvks,
      tvks.len()
    )));
  }

  let record_type = ValueType::<N>::from_str("credits.record")
    .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?;
  let credits_id = ProgramID::<N>::from_str(CREDITS_PROGRAM)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;
  let join_fn = Identifier::<N>::from_str("join")
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;
  let transfer_fn = Identifier::<N>::from_str(transfer_fn_name)
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let mut join_requests: Vec<PreparedRequest<N>> = Vec::with_capacity(n - 1);
  let mut current_left = parsed_records[0].clone();

  for (i, _) in parsed_records.iter().enumerate().take(n).skip(1) {
    let right = parsed_records[i].clone();
    // Consume the host-supplied TVK for this join transition (root is index 0).
    let tvk = *tvks.get(i).ok_or_else(|| {
      AppError::BadRequest(format!(
        "Insufficient TVKs: join transition {} requires a TVK but only {} were supplied",
        i,
        tvks.len()
      ))
    })?;
    let nonce = derive_join_output_nonce::<N>(tvk)?;

    let left_mc = extract_microcredits::<N>(&current_left)?;
    let right_mc = extract_microcredits::<N>(&right)?;
    let merged_mc = left_mc
      .checked_add(right_mc)
      .ok_or_else(|| AppError::BadRequest("Microcredit overflow in join chain".to_string()))?;

    // Contract argument order: join(r0, r1) for the first pair,
    // join(r_i, prev_merged) for subsequent pairs.
    let (r0, r1) = if i == 1 {
      (current_left.clone(), right)
    } else {
      (right.clone(), current_left.clone())
    };

    let join_req = PreparedRequest::new_nested(
      network_id,
      credits_id,
      join_fn,
      vec![Value::Record(r0), Value::Record(r1)],
      vec![record_type.clone(), record_type.clone()],
    );

    join_requests.push(join_req);
    current_left = build_merged_record(signer_address, merged_mc, nonce)?;
  }

  let transfer_req = PreparedRequest::new_nested(
    network_id,
    credits_id,
    transfer_fn,
    vec![
      Value::Record(current_left),
      Value::from(Literal::Address(recipient)),
      Value::from(Literal::U64(U64::new(amount))),
    ],
    vec![
      record_type,
      ValueType::<N>::from_str(addr_type)
        .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
      ValueType::<N>::from_str(amount_type)
        .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ],
  );

  let mut nested = join_requests;
  nested.push(transfer_req);
  Ok(nested)
}

/// Transfer credits from a private record to another address, producing recipient and
/// change output records.
pub fn create_transfer_private_request<N: Network>(
  network_id: u16,
  amount: u64,
  to_address: &str,
  record_content: &RecordContent,
) -> AppResult<PreparedRequest<N>> {
  let program_id = ProgramID::<N>::from_str(CREDITS_PROGRAM)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;

  let function_name = Identifier::<N>::from_str("transfer_private")
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let to_address = Address::<N>::from_str(to_address)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid recipient address: {}", e)))?;

  let record = record_content_to_record(record_content)?;

  let inputs = vec![
    Value::<N>::Record(record),
    Value::<N>::from(Literal::Address(to_address)),
    Value::from(Literal::U64(U64::new(amount))),
  ];

  let input_types = vec![
    ValueType::<N>::from_str("credits.record")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("address.private")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("u64.private")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  ];

  Ok(PreparedRequest::new(
    network_id,
    program_id,
    function_name,
    inputs,
    input_types,
  ))
}

#[allow(clippy::too_many_arguments)]
fn create_transfer_private_n_request<N: Network>(
  network_id: u16,
  program_id_str: &str,
  function_name_str: &str,
  expected_records: usize,
  amount: u64,
  to_address: &str,
  records: &[RecordContent],
  signer_address: Option<&Address<N>>,
  tvks: &[Field<N>],
) -> AppResult<PreparedRequest<N>> {
  if records.len() != expected_records {
    return Err(AppError::BadRequest(format!(
      "{} requires exactly {} records, got {}",
      function_name_str,
      expected_records,
      records.len()
    )));
  }

  let program_id = ProgramID::<N>::from_str(program_id_str)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;

  let function_name = Identifier::<N>::from_str(function_name_str)
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let to_address_parsed = Address::<N>::from_str(to_address)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid recipient address: {}", e)))?;

  let record_type = ValueType::<N>::from_str("credits.aleo/credits.record")
    .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?;

  let parsed_records: Vec<Record<N, Plaintext<N>>> = records
    .iter()
    .map(record_content_to_record)
    .collect::<AppResult<Vec<_>>>()?;

  let mut inputs = Vec::with_capacity(expected_records + 2);
  let mut input_types = Vec::with_capacity(expected_records + 2);

  for record in &parsed_records {
    inputs.push(Value::<N>::Record(record.clone()));
    input_types.push(record_type.clone());
  }

  inputs.push(Value::<N>::from(Literal::Address(to_address_parsed)));
  input_types.push(
    ValueType::<N>::from_str("address.private")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  );

  inputs.push(Value::from(Literal::U64(U64::new(amount))));
  input_types.push(
    ValueType::<N>::from_str("u64.private")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  );

  let mut root = PreparedRequest::new(network_id, program_id, function_name, inputs, input_types);

  if let Some(address) = signer_address {
    root.nested_calls = build_join_transfer_nested_calls(
      network_id,
      amount,
      &parsed_records,
      address,
      tvks,
      "transfer_private",
      to_address_parsed,
      "address.private",
      "u64.private",
    )?;
  }

  let program_src = fetch_program_source_by_id(program_id_str)?;
  root = root.with_program_checksum(compute_program_checksum::<N>(program_src)?);

  Ok(root)
}

/// Prepare request for batch private transfer
/// expect records count from 2 up to 14
pub fn create_transfer_private_batch_request<N: Network>(
  network_id: u16,
  amount: u64,
  to_address: &str,
  records: &[RecordContent],
  signer_address: Option<&Address<N>>,
  tvks: &[Field<N>],
) -> AppResult<PreparedRequest<N>> {
  let records_count: usize = records.len();
  let (program_id_str, function_name) = match records_count {
    2..=8 => (
      LDGBATCHER_28_PROGRAM,
      format!("transfer_private_{}", records_count),
    ),
    9..=10 => (
      LDGBATCHER_910_PROGRAM,
      format!("transfer_private_{}", records_count),
    ),
    11..=14 => (
      LDGBATCHER_1114_PROGRAM,
      format!("transfer_private_{}", records_count),
    ),
    _ => {
      return Err(AppError::BadRequest(format!(
        "transfer_private_batch requires 2-14 records, got {}",
        records_count
      )));
    }
  };
  create_transfer_private_n_request(
    network_id,
    program_id_str,
    &function_name,
    records_count,
    amount,
    to_address,
    records,
    signer_address,
    tvks,
  )
}

#[allow(clippy::too_many_arguments)]
fn create_transfer_private_to_public_n_request<N: Network>(
  network_id: u16,
  program_id_str: &str,
  function_name_str: &str,
  expected_records: usize,
  amount: u64,
  records: &[RecordContent],
  signer_address: Option<&Address<N>>,
  tvks: &[Field<N>],
) -> AppResult<PreparedRequest<N>> {
  if records.len() != expected_records {
    return Err(AppError::BadRequest(format!(
      "{} requires exactly {} records, got {}",
      function_name_str,
      expected_records,
      records.len()
    )));
  }

  let program_id = ProgramID::<N>::from_str(program_id_str)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;

  let function_name = Identifier::<N>::from_str(function_name_str)
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let record_type = ValueType::<N>::from_str("credits.aleo/credits.record")
    .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?;

  let parsed_records: Vec<Record<N, Plaintext<N>>> = records
    .iter()
    .map(record_content_to_record)
    .collect::<AppResult<Vec<_>>>()?;

  let mut inputs = Vec::with_capacity(expected_records + 1);
  let mut input_types = Vec::with_capacity(expected_records + 1);

  for record in &parsed_records {
    inputs.push(Value::<N>::Record(record.clone()));
    input_types.push(record_type.clone());
  }

  inputs.push(Value::from(Literal::U64(U64::new(amount))));
  input_types.push(
    ValueType::<N>::from_str("u64.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  );

  let mut root = PreparedRequest::new(network_id, program_id, function_name, inputs, input_types);

  if let Some(address) = signer_address {
    root.nested_calls = build_join_transfer_nested_calls(
      network_id,
      amount,
      &parsed_records,
      address,
      tvks,
      "transfer_private_to_public",
      *address,
      "address.public",
      "u64.public",
    )?;
  }

  let program_src = fetch_program_source_by_id(program_id_str)?;
  root = root.with_program_checksum(compute_program_checksum::<N>(program_src)?);

  Ok(root)
}

/// Prepare request for batch private to public transfer
/// expect records count from 2 up to 14
pub fn create_transfer_private_to_public_batch_request<N: Network>(
  network_id: u16,
  amount: u64,
  records: &[RecordContent],
  signer_address: Option<&Address<N>>,
  tvks: &[Field<N>],
) -> AppResult<PreparedRequest<N>> {
  let records_count: usize = records.len();
  let (program_id_str, function_name) = match records_count {
    2..=8 => (
      LDGBATCHER_PPUB_28_PROGRAM,
      format!("transfer_private_to_public_{}", records_count),
    ),
    9..=10 => (
      LDGBATCHER_PPUB_910_PROGRAM,
      format!("transfer_private_to_public_{}", records_count),
    ),
    11..=14 => (
      LDGBATCHER_PPUB_1114_PROGRAM,
      format!("transfer_private_to_public_{}", records_count),
    ),
    _ => {
      return Err(AppError::BadRequest(format!(
        "transfer_private_to_public_batch requires 2-14 records, got {}",
        records_count
      )));
    }
  };
  create_transfer_private_to_public_n_request(
    network_id,
    program_id_str,
    &function_name,
    records_count,
    amount,
    records,
    signer_address,
    tvks,
  )
}

/// Transfer credits from public balance to another address's public balance.
pub fn create_transfer_public_request<N: Network>(
  network_id: u16,
  amount: u64,
  to_address: &str,
) -> AppResult<PreparedRequest<N>> {
  let program_id = ProgramID::<N>::from_str(CREDITS_PROGRAM)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;

  let function_name = Identifier::<N>::from_str("transfer_public")
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let to_address = Address::<N>::from_str(to_address)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid recipient address: {}", e)))?;

  let inputs = vec![
    Value::<N>::from(Literal::Address(to_address)),
    Value::from(Literal::U64(U64::new(amount))),
  ];

  let input_types = vec![
    ValueType::<N>::from_str("address.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("u64.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  ];

  Ok(PreparedRequest::new(
    network_id,
    program_id,
    function_name,
    inputs,
    input_types,
  ))
}

/// Convert credits from a private record to public balance.
pub fn create_transfer_private_to_public_request<N: Network>(
  network_id: u16,
  amount: u64,
  to_address: &str,
  record_content: &RecordContent,
) -> AppResult<PreparedRequest<N>> {
  let program_id = ProgramID::<N>::from_str(CREDITS_PROGRAM)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;

  let function_name = Identifier::<N>::from_str("transfer_private_to_public")
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let to_address = Address::<N>::from_str(to_address)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid recipient address: {}", e)))?;

  let record = record_content_to_record(record_content)?;

  let inputs = vec![
    Value::<N>::Record(record),
    Value::<N>::from(Literal::Address(to_address)),
    Value::from(Literal::U64(U64::new(amount))),
  ];

  let input_types = vec![
    ValueType::<N>::from_str("credits.record")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("address.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("u64.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  ];

  Ok(PreparedRequest::new(
    network_id,
    program_id,
    function_name,
    inputs,
    input_types,
  ))
}

/// Convert credits from public balance to a private record.
pub fn create_transfer_public_to_private_request<N: Network>(
  network_id: u16,
  amount: u64,
  to_address: &str,
) -> AppResult<PreparedRequest<N>> {
  let program_id = ProgramID::<N>::from_str(CREDITS_PROGRAM)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;

  let function_name = Identifier::<N>::from_str("transfer_public_to_private")
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let to_address = Address::<N>::from_str(to_address)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid recipient address: {}", e)))?;

  let inputs = vec![
    Value::<N>::from(Literal::Address(to_address)),
    Value::from(Literal::U64(U64::new(amount))),
  ];

  let input_types = vec![
    ValueType::<N>::from_str("address.private")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("u64.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  ];

  Ok(PreparedRequest::new(
    network_id,
    program_id,
    function_name,
    inputs,
    input_types,
  ))
}

/// Create a prepared request for a public stablecoin transfer (`transfer_public`).
///
/// Calls `<program_id>/transfer_public(recipient: address.public, amount: u128.public)`.
/// `program_id` must be a supported stablecoin program (see [`STABLECOIN_PROGRAMS`]).
/// Amounts are `u128` token base units (stablecoins use u128, unlike credits' u64).
pub fn create_transfer_token_public_request<N: Network>(
  network_id: u16,
  program_id_str: &str,
  amount: u128,
  to_address: &str,
) -> AppResult<PreparedRequest<N>> {
  let program_id = ProgramID::<N>::from_str(validate_stablecoin_program(program_id_str)?)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;

  let function_name = Identifier::<N>::from_str("transfer_public")
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let to_address = Address::<N>::from_str(to_address)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid recipient address: {}", e)))?;

  let inputs = vec![
    Value::<N>::from(Literal::Address(to_address)),
    Value::from(Literal::U128(U128::new(amount))),
  ];

  let input_types = vec![
    ValueType::<N>::from_str("address.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("u128.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  ];

  let request = PreparedRequest::new(network_id, program_id, function_name, inputs, input_types);
  // Stablecoin programs declare a constructor, so the request must carry the program
  // checksum for snarkVM's `request.verify` during authorization.
  Ok(
    request.with_program_checksum(compute_program_checksum::<N>(fetch_program_source_by_id(
      program_id_str,
    )?)?),
  )
}

/// Create a prepared request for a public-to-private stablecoin transfer (`transfer_public_to_private`).
///
/// Calls `<program_id>/transfer_public_to_private(recipient: address.private, amount: u128.public)`.
/// Note the recipient is a **private** input here (vs public in `transfer_public`).
pub fn create_transfer_token_public_to_private_request<N: Network>(
  network_id: u16,
  program_id_str: &str,
  amount: u128,
  to_address: &str,
) -> AppResult<PreparedRequest<N>> {
  let program_id = ProgramID::<N>::from_str(validate_stablecoin_program(program_id_str)?)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;

  let function_name = Identifier::<N>::from_str("transfer_public_to_private")
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let to_address = Address::<N>::from_str(to_address)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid recipient address: {}", e)))?;

  let inputs = vec![
    Value::<N>::from(Literal::Address(to_address)),
    Value::from(Literal::U128(U128::new(amount))),
  ];

  let input_types = vec![
    ValueType::<N>::from_str("address.private")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("u128.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  ];

  let request = PreparedRequest::new(network_id, program_id, function_name, inputs, input_types);
  // Stablecoin programs declare a constructor, so the request must carry the program
  // checksum for snarkVM's `request.verify` during authorization.
  Ok(
    request.with_program_checksum(compute_program_checksum::<N>(fetch_program_source_by_id(
      program_id_str,
    )?)?),
  )
}

/// Shared builder for the two private stablecoin transfers. The variants differ only in the
/// function name and the visibility of the recipient/amount inputs; the spent `Token.record`
/// and the `[MerkleProof; 2].private` exclusion proof are identical.
///
/// `merkle_proof_str` is the freeze-list exclusion proof as a formatted Leo `[MerkleProof; 2]`
/// literal built client-side. It is parsed here; a malformed literal yields a `BadRequest`.
#[allow(clippy::too_many_arguments)]
fn create_transfer_token_private_n_request<N: Network>(
  network_id: u16,
  program_id_str: &str,
  function_name_str: &str,
  addr_type: &str,
  amount_type: &str,
  amount: u128,
  to_address: &str,
  record_content: &RecordContent,
  merkle_proof_str: &str,
) -> AppResult<PreparedRequest<N>> {
  let program_id = ProgramID::<N>::from_str(validate_stablecoin_program(program_id_str)?)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;

  let function_name = Identifier::<N>::from_str(function_name_str)
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let to_address = Address::<N>::from_str(to_address)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid recipient address: {}", e)))?;

  let record = record_content_to_record(record_content)?;

  let merkle_proof = Value::<N>::from_str(merkle_proof_str)
    .map_err(|e| AppError::BadRequest(format!("Invalid merkle_proof literal: {}", e)))?;

  let inputs = vec![
    Value::<N>::from(Literal::Address(to_address)),
    Value::from(Literal::U128(U128::new(amount))),
    Value::<N>::Record(record),
    merkle_proof,
  ];

  let input_types = vec![
    ValueType::<N>::from_str(addr_type)
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str(amount_type)
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("Token.record")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("[MerkleProof; 2u32].private")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  ];

  let request = PreparedRequest::new(network_id, program_id, function_name, inputs, input_types);
  // Stablecoin programs declare a constructor, so the request must carry the program
  // checksum for snarkVM's `request.verify` during authorization.
  Ok(
    request.with_program_checksum(compute_program_checksum::<N>(fetch_program_source_by_id(
      program_id_str,
    )?)?),
  )
}

/// Create a prepared request for a private stablecoin transfer (`transfer_private`).
///
/// Calls `<program_id>/transfer_private(recipient: address.private, amount: u128.private,
/// token: Token.record, proofs: [MerkleProof; 2].private)`.
pub fn create_transfer_token_private_request<N: Network>(
  network_id: u16,
  program_id_str: &str,
  amount: u128,
  to_address: &str,
  record_content: &RecordContent,
  merkle_proof_str: &str,
) -> AppResult<PreparedRequest<N>> {
  create_transfer_token_private_n_request(
    network_id,
    program_id_str,
    "transfer_private",
    "address.private",
    "u128.private",
    amount,
    to_address,
    record_content,
    merkle_proof_str,
  )
}

/// Create a prepared request for a private-to-public stablecoin transfer
/// (`transfer_private_to_public`).
///
/// Calls `<program_id>/transfer_private_to_public(recipient: address.public, amount: u128.public,
/// token: Token.record, proofs: [MerkleProof; 2].private)`. Identical to
/// [`create_transfer_token_private_request`] except recipient and amount are **public** inputs.
pub fn create_transfer_token_private_to_public_request<N: Network>(
  network_id: u16,
  program_id_str: &str,
  amount: u128,
  to_address: &str,
  record_content: &RecordContent,
  merkle_proof_str: &str,
) -> AppResult<PreparedRequest<N>> {
  create_transfer_token_private_n_request(
    network_id,
    program_id_str,
    "transfer_private_to_public",
    "address.public",
    "u128.public",
    amount,
    to_address,
    record_content,
    merkle_proof_str,
  )
}

/// Extract the `amount` u128 value from a stablecoin `Token.record`.
fn extract_token_amount<N: Network>(record: &Record<N, Plaintext<N>>) -> AppResult<u128> {
  let key = Identifier::<N>::from_str("amount")
    .map_err(|e| AppError::InvalidRecord(format!("Invalid identifier: {}", e)))?;

  let entry = record
    .data()
    .get(&key)
    .ok_or_else(|| AppError::InvalidRecord("Record has no amount field".to_string()))?;

  let literal = match entry {
    Entry::Constant(Plaintext::Literal(lit, _))
    | Entry::Public(Plaintext::Literal(lit, _))
    | Entry::Private(Plaintext::Literal(lit, _)) => lit,
    _ => {
      return Err(AppError::InvalidRecord(
        "Unexpected amount entry type".to_string(),
      ));
    }
  };

  match literal {
    Literal::U128(v) => Ok(**v),
    _ => Err(AppError::InvalidRecord(
      "Expected U128 amount literal".to_string(),
    )),
  }
}

/// Build the merged `Token.record` that `<stablecoin>/join` would produce. The nonce is derived
/// from the host-supplied TVK of the join transition (ADR005), so the server can construct the
/// intermediate record without ever knowing the on-device nonce material. `join` preserves
/// `r0.owner`, and all batch records share the signer as owner, so the merged owner is the signer.
fn build_merged_token_record<N: Network>(
  signer_address: &Address<N>,
  total_amount: u128,
  nonce: Group<N>,
) -> AppResult<Record<N, Plaintext<N>>> {
  let mut data = HashMap::new();
  data.insert(
    "amount".to_string(),
    format!("{}u128.private", total_amount),
  );
  let content = RecordContent {
    owner: format!("{}.private", signer_address),
    data,
    nonce: nonce.to_string(),
    version: 1,
  };
  record_content_to_record(&content)
}

/// Resolve the batcher program ID for a stablecoin + record count + direction. The stablecoin
/// family (usdcx/usad, mainnet or testnet) selects the batcher set; the record count and direction
/// then pick the specific batcher. Future tokens map in here once their batcher contracts ship.
fn token_batcher_program_for(
  stablecoin_program_id: &str,
  records_count: usize,
  is_p2p: bool,
) -> AppResult<&'static str> {
  // [p_28, p_910, p_1113, p2p_28, p2p_910, p2p_1113]
  let batchers: [&'static str; 6] = match stablecoin_program_id {
    USDCX_STABLECOIN_PROGRAM | TEST_USDCX_STABLECOIN_PROGRAM => [
      USDCX_BATCHER_P_28_PROGRAM,
      USDCX_BATCHER_P_910_PROGRAM,
      USDCX_BATCHER_P_1113_PROGRAM,
      USDCX_BATCHER_P2P_28_PROGRAM,
      USDCX_BATCHER_P2P_910_PROGRAM,
      USDCX_BATCHER_P2P_1113_PROGRAM,
    ],
    USAD_STABLECOIN_PROGRAM | TEST_USAD_STABLECOIN_PROGRAM => [
      USAD_BATCHER_P_28_PROGRAM,
      USAD_BATCHER_P_910_PROGRAM,
      USAD_BATCHER_P_1113_PROGRAM,
      USAD_BATCHER_P2P_28_PROGRAM,
      USAD_BATCHER_P2P_910_PROGRAM,
      USAD_BATCHER_P2P_1113_PROGRAM,
    ],
    other => {
      return Err(AppError::InvalidIntent(format!(
        "No batch transfer support for stablecoin program '{other}'"
      )));
    }
  };
  let program = match (records_count, is_p2p) {
    (2..=8, false) => batchers[0],
    (9..=10, false) => batchers[1],
    (11..=13, false) => batchers[2],
    (2..=8, true) => batchers[3],
    (9..=10, true) => batchers[4],
    (11..=13, true) => batchers[5],
    _ => {
      return Err(AppError::BadRequest(format!(
        "Token batch requires 2-{} records, got {}",
        MAX_TOKEN_BATCH_RECORDS, records_count
      )));
    }
  };
  Ok(program)
}

/// Build the nested call list for a token batcher transfer function:
///   (N-1) × <stablecoin>/join  +  1 × <stablecoin>/<transfer_fn_name>
///
/// Mirrors [`build_join_transfer_nested_calls`] but for stablecoin `Token` records: amounts are
/// `u128`, the final transfer takes `(recipient, amount, merged_token, proofs)`, and — because the
/// stablecoin program declares a constructor — every nested request carries the stablecoin's
/// `program_checksum` so the device signs the same challenge snarkVM's `request.verify` reconstructs.
#[allow(clippy::too_many_arguments)]
fn build_token_join_transfer_nested_calls<N: Network>(
  network_id: u16,
  stablecoin_id: ProgramID<N>,
  stablecoin_checksum: Field<N>,
  amount: u128,
  parsed_records: &[Record<N, Plaintext<N>>],
  signer_address: &Address<N>,
  tvks: &[Field<N>],
  transfer_fn_name: &str,
  recipient: Address<N>,
  addr_type: &str,
  amount_type: &str,
  proof: &Value<N>,
) -> AppResult<Vec<PreparedRequest<N>>> {
  let n = parsed_records.len();

  let expected_tvks = n + 1;
  if tvks.len() != expected_tvks {
    return Err(AppError::BadRequest(format!(
      "Unexpected number of TVKs: expected {} (one per transition in [root, joins..., transfer]), got {}",
      expected_tvks,
      tvks.len()
    )));
  }

  // Nested calls execute inside the stablecoin program, so the `Token` record and `MerkleProof`
  // types are LOCAL (unqualified) here, unlike the program-qualified external types at the root.
  let record_type = ValueType::<N>::from_str("Token.record")
    .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?;
  let join_fn = Identifier::<N>::from_str("join")
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;
  let transfer_fn = Identifier::<N>::from_str(transfer_fn_name)
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let mut join_requests: Vec<PreparedRequest<N>> = Vec::with_capacity(n - 1);
  let mut current_left = parsed_records[0].clone();

  for (i, _) in parsed_records.iter().enumerate().take(n).skip(1) {
    let right = parsed_records[i].clone();
    let tvk = *tvks.get(i).ok_or_else(|| {
      AppError::BadRequest(format!(
        "Insufficient TVKs: join transition {} requires a TVK but only {} were supplied",
        i,
        tvks.len()
      ))
    })?;
    let nonce = derive_join_output_nonce::<N>(tvk)?;

    let left_amount = extract_token_amount::<N>(&current_left)?;
    let right_amount = extract_token_amount::<N>(&right)?;
    let merged_amount = left_amount
      .checked_add(right_amount)
      .ok_or_else(|| AppError::BadRequest("Token amount overflow in join chain".to_string()))?;

    // Contract argument order: join(r0, r1) for the first pair, join(r_i, prev_merged) after.
    let (r0, r1) = if i == 1 {
      (current_left.clone(), right)
    } else {
      (right.clone(), current_left.clone())
    };

    let join_req = PreparedRequest::new_nested(
      network_id,
      stablecoin_id,
      join_fn,
      vec![Value::Record(r0), Value::Record(r1)],
      vec![record_type.clone(), record_type.clone()],
    )
    .with_program_checksum(stablecoin_checksum);

    join_requests.push(join_req);
    current_left = build_merged_token_record(signer_address, merged_amount, nonce)?;
  }

  let transfer_req = PreparedRequest::new_nested(
    network_id,
    stablecoin_id,
    transfer_fn,
    vec![
      Value::from(Literal::Address(recipient)),
      Value::from(Literal::U128(U128::new(amount))),
      Value::Record(current_left),
      proof.clone(),
    ],
    vec![
      ValueType::<N>::from_str(addr_type)
        .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
      ValueType::<N>::from_str(amount_type)
        .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
      record_type,
      ValueType::<N>::from_str("[MerkleProof; 2u32].private")
        .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ],
  )
  .with_program_checksum(stablecoin_checksum);

  let mut nested = join_requests;
  nested.push(transfer_req);
  Ok(nested)
}

/// Shared builder for batch stablecoin private transfers (`transfer_private` / `_to_public`).
/// Builds the batcher root request (external `Token` records + recipient + amount + external
/// `[MerkleProof; 2]`) and, when a signer is supplied, the nested join/transfer chain. The single
/// `merkle_proof_str` proves freeze-list exclusion for the sender, so all spent records must share
/// the sender as owner.
#[allow(clippy::too_many_arguments)]
fn create_transfer_token_private_batch_n_request<N: Network>(
  network_id: u16,
  stablecoin_program_id: &str,
  is_p2p: bool,
  addr_type: &str,
  amount_type: &str,
  amount: u128,
  to_address: &str,
  records: &[RecordContent],
  merkle_proof_str: &str,
  signer_address: Option<&Address<N>>,
  tvks: &[Field<N>],
) -> AppResult<PreparedRequest<N>> {
  let stablecoin_program_id = validate_stablecoin_program(stablecoin_program_id)?;
  let records_count = records.len();
  let batcher_id_str = token_batcher_program_for(stablecoin_program_id, records_count, is_p2p)?;
  let transfer_fn_name = if is_p2p {
    "transfer_private_to_public"
  } else {
    "transfer_private"
  };
  let root_fn_name = format!("{transfer_fn_name}_{records_count}");

  // The single freeze-list proof covers only the sender, and `join` preserves `r0.owner`, so all
  // spent records must be owned by the same sender.
  if let Some(first) = records.first()
    && records.iter().any(|r| r.owner != first.owner)
  {
    return Err(AppError::InvalidIntent(
      "All batch records must have the same owner (the sender)".to_string(),
    ));
  }

  let batcher_id = ProgramID::<N>::from_str(batcher_id_str)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;
  let stablecoin_id = ProgramID::<N>::from_str(stablecoin_program_id)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;
  let function_name = Identifier::<N>::from_str(&root_fn_name)
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;
  let recipient = Address::<N>::from_str(to_address)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid recipient address: {}", e)))?;

  let parsed_records: Vec<Record<N, Plaintext<N>>> = records
    .iter()
    .map(record_content_to_record)
    .collect::<AppResult<Vec<_>>>()?;

  let merkle_proof = Value::<N>::from_str(merkle_proof_str)
    .map_err(|e| AppError::BadRequest(format!("Invalid merkle_proof literal: {}", e)))?;

  // Root input/types: program-qualified external `Token` records, then recipient, amount, and the
  // program-qualified external `[MerkleProof; 2]` (always `.private`, for both directions).
  let external_record_type =
    ValueType::<N>::from_str(&format!("{stablecoin_program_id}/Token.record"))
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?;
  let proof_root_type = ValueType::<N>::from_str(&format!(
    "[{stablecoin_program_id}/MerkleProof; 2u32].private"
  ))
  .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?;

  let mut inputs = Vec::with_capacity(records_count + 3);
  let mut input_types = Vec::with_capacity(records_count + 3);
  for record in &parsed_records {
    inputs.push(Value::<N>::Record(record.clone()));
    input_types.push(external_record_type.clone());
  }
  inputs.push(Value::<N>::from(Literal::Address(recipient)));
  input_types.push(
    ValueType::<N>::from_str(addr_type)
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  );
  inputs.push(Value::from(Literal::U128(U128::new(amount))));
  input_types.push(
    ValueType::<N>::from_str(amount_type)
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  );
  inputs.push(merkle_proof.clone());
  input_types.push(proof_root_type);

  let mut root = PreparedRequest::new(network_id, batcher_id, function_name, inputs, input_types);

  if let Some(address) = signer_address {
    let stablecoin_checksum =
      compute_program_checksum::<N>(fetch_program_source_by_id(stablecoin_program_id)?)?;
    root.nested_calls = build_token_join_transfer_nested_calls(
      network_id,
      stablecoin_id,
      stablecoin_checksum,
      amount,
      &parsed_records,
      address,
      tvks,
      transfer_fn_name,
      recipient,
      addr_type,
      amount_type,
      &merkle_proof,
    )?;
  }

  // Root checksum is the batcher's (network-specific source). snarkVM's `request.verify` requires it
  // because the batcher declares a constructor.
  let batcher_src = fetch_batcher_source::<N>(batcher_id_str)?;
  root = root.with_program_checksum(compute_program_checksum::<N>(batcher_src)?);

  Ok(root)
}

/// Create a prepared request for a batch private stablecoin transfer
/// (`ldg_<token>_p_*/transfer_private_N`). Joins 2-13 `Token` records and transfers privately,
/// proving freeze-list exclusion once for the sender. `merkle_proof_str` is the exclusion proof.
#[allow(clippy::too_many_arguments)]
pub fn create_transfer_token_private_batch_request<N: Network>(
  network_id: u16,
  program_id_str: &str,
  amount: u128,
  to_address: &str,
  records: &[RecordContent],
  merkle_proof_str: &str,
  signer_address: Option<&Address<N>>,
  tvks: &[Field<N>],
) -> AppResult<PreparedRequest<N>> {
  create_transfer_token_private_batch_n_request(
    network_id,
    program_id_str,
    false,
    "address.private",
    "u128.private",
    amount,
    to_address,
    records,
    merkle_proof_str,
    signer_address,
    tvks,
  )
}

/// Create a prepared request for a batch private-to-public stablecoin transfer
/// (`ldg_<token>_p2p_*/transfer_private_to_public_N`). Like
/// [`create_transfer_token_private_batch_request`] but recipient/amount are public inputs.
#[allow(clippy::too_many_arguments)]
pub fn create_transfer_token_private_to_public_batch_request<N: Network>(
  network_id: u16,
  program_id_str: &str,
  amount: u128,
  to_address: &str,
  records: &[RecordContent],
  merkle_proof_str: &str,
  signer_address: Option<&Address<N>>,
  tvks: &[Field<N>],
) -> AppResult<PreparedRequest<N>> {
  create_transfer_token_private_batch_n_request(
    network_id,
    program_id_str,
    true,
    "address.public",
    "u128.public",
    amount,
    to_address,
    records,
    merkle_proof_str,
    signer_address,
    tvks,
  )
}

/// Pay transaction fees using a private credits record.
pub fn create_fee_private_request<N: Network>(
  network_id: u16,
  base_fee: u64,
  priority_fee: u64,
  execution_id: &str,
  record_content: &RecordContent,
) -> AppResult<PreparedRequest<N>> {
  let program_id = ProgramID::<N>::from_str(CREDITS_PROGRAM)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;

  let function_name = Identifier::<N>::from_str("fee_private")
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let record = record_content_to_record(record_content)?;

  let exec_id = Field::<N>::from_str(execution_id)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid execution ID: {}", e)))?;

  let inputs = vec![
    Value::<N>::Record(record),
    Value::<N>::from(Literal::U64(U64::new(base_fee))),
    Value::<N>::from(Literal::U64(U64::new(priority_fee))),
    Value::<N>::from(Literal::Field(exec_id)),
  ];

  let input_types = vec![
    ValueType::<N>::from_str("credits.record")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("u64.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("u64.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("field.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  ];

  Ok(PreparedRequest::new(
    network_id,
    program_id,
    function_name,
    inputs,
    input_types,
  ))
}

/// Pay transaction fees using public credits balance.
pub fn create_fee_public_request<N: Network>(
  network_id: u16,
  base_fee: u64,
  priority_fee: u64,
  execution_id: &str,
) -> AppResult<PreparedRequest<N>> {
  let program_id = ProgramID::<N>::from_str(CREDITS_PROGRAM)
    .map_err(|e| AppError::BadRequest(format!("Invalid program ID: {}", e)))?;

  let function_name = Identifier::<N>::from_str("fee_public")
    .map_err(|e| AppError::BadRequest(format!("Invalid function name: {}", e)))?;

  let exec_id = Field::<N>::from_str(execution_id)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid execution ID: {}", e)))?;

  let inputs = vec![
    Value::<N>::from(Literal::U64(U64::new(base_fee))),
    Value::<N>::from(Literal::U64(U64::new(priority_fee))),
    Value::<N>::from(Literal::Field(exec_id)),
  ];

  let input_types = vec![
    ValueType::<N>::from_str("u64.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("u64.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
    ValueType::<N>::from_str("field.public")
      .map_err(|e| AppError::BadRequest(format!("Invalid input type: {}", e)))?,
  ];

  Ok(PreparedRequest::new(
    network_id,
    program_id,
    function_name,
    inputs,
    input_types,
  ))
}

#[cfg(test)]
mod tests {
  use super::*;
  use snarkvm::prelude::TestnetV0;
  use std::collections::HashMap;

  #[test]
  fn test_record_content_to_record_success() {
    let mut data = HashMap::new();
    data.insert("microcredits".to_string(), "6564640u64.private".to_string());

    let content = RecordContent {
      owner: "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu.private".to_string(),
      data,
      nonce: "3464614586029802535577209894878281774938899585256819212454902402155441681025group"
        .to_string(),
      version: 1,
    };

    let result = record_content_to_record::<TestnetV0>(&content);
    assert!(
      result.is_ok(),
      "Failed to convert record: {:?}",
      result.err()
    );

    let record = result.unwrap();
    assert_eq!(
      record.owner().to_string(),
      "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu.private"
    );
    assert_eq!(
      record.nonce().to_string(),
      "3464614586029802535577209894878281774938899585256819212454902402155441681025group"
    );
    assert_eq!(record.version(), &U8::new(1));
    assert!(
      record
        .data()
        .contains_key(&Identifier::from_str("microcredits").unwrap())
    );
  }

  #[test]
  fn test_record_content_to_record_invalid_owner() {
    let content = RecordContent {
      owner: "invalid_owner".to_string(),
      data: HashMap::new(),
      nonce: "3464614586029802535577209894878281774938899585256819212454902402155441681025group"
        .to_string(),
      version: 1,
    };

    let result = record_content_to_record::<TestnetV0>(&content);
    assert!(result.is_err());
    match result.unwrap_err() {
      AppError::InvalidRecord(msg) => assert!(msg.contains("Invalid record owner")),
      _ => panic!("Expected InvalidRecord error"),
    }
  }

  #[test]
  fn test_record_content_to_record_invalid_owner_type() {
    // A literal that is not an address
    let content = RecordContent {
      owner: "1u32.public".to_string(),
      data: HashMap::new(),
      nonce: "3464614586029802535577209894878281774938899585256819212454902402155441681025group"
        .to_string(),
      version: 1,
    };

    let result = record_content_to_record::<TestnetV0>(&content);
    assert!(result.is_err());
    match result.unwrap_err() {
      AppError::InvalidRecord(msg) => {
        assert!(msg.contains("must be an address with valid visibility"))
      }
      _ => panic!("Expected InvalidRecord error"),
    }
  }

  #[test]
  fn test_record_content_to_record_invalid_data_key() {
    let mut data = HashMap::new();
    data.insert("invalid key!".to_string(), "1u64.private".to_string());

    let content = RecordContent {
      owner: "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu.private".to_string(),
      data,
      nonce: "3464614586029802535577209894878281774938899585256819212454902402155441681025group"
        .to_string(),
      version: 1,
    };

    let result = record_content_to_record::<TestnetV0>(&content);
    assert!(result.is_err());
    match result.unwrap_err() {
      AppError::InvalidRecord(msg) => assert!(msg.contains("Invalid record data key")),
      _ => panic!("Expected InvalidRecord error"),
    }
  }

  #[test]
  fn test_record_content_to_record_invalid_data_value() {
    let mut data = HashMap::new();
    data.insert("microcredits".to_string(), "invalid_value".to_string());

    let content = RecordContent {
      owner: "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu.private".to_string(),
      data,
      nonce: "3464614586029802535577209894878281774938899585256819212454902402155441681025group"
        .to_string(),
      version: 1,
    };

    let result = record_content_to_record::<TestnetV0>(&content);
    assert!(result.is_err());
    match result.unwrap_err() {
      AppError::InvalidRecord(msg) => assert!(msg.contains("Invalid record data value")),
      _ => panic!("Expected InvalidRecord error"),
    }
  }

  #[test]
  fn test_record_content_to_record_invalid_nonce() {
    let content = RecordContent {
      owner: "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu.private".to_string(),
      data: HashMap::new(),
      nonce: "invalid_nonce".to_string(),
      version: 1,
    };

    let result = record_content_to_record::<TestnetV0>(&content);
    assert!(result.is_err());
    match result.unwrap_err() {
      AppError::InvalidRecord(msg) => assert!(msg.contains("Invalid record nonce")),
      _ => panic!("Expected InvalidRecord error"),
    }
  }

  // ---- Host-supplied TVK consumption (ADR005) ----

  const SIGNER_ADDRESS: &str = "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu";

  fn record_with_microcredits(mc: u64) -> RecordContent {
    let mut data = HashMap::new();
    data.insert("microcredits".to_string(), format!("{}u64.private", mc));
    RecordContent {
      owner: format!("{}.private", SIGNER_ADDRESS),
      data,
      nonce: "3464614586029802535577209894878281774938899585256819212454902402155441681025group"
        .to_string(),
      version: 1,
    }
  }

  /// Distinct, deterministic TVKs so we can assert which one was consumed.
  fn fake_tvks(len: usize) -> Vec<Field<TestnetV0>> {
    (0..len).map(|k| Field::from_u64(k as u64 + 7)).collect()
  }

  #[test]
  fn test_batch_transfer_consumes_tvk_at_join_transition_index() {
    // Two records → transitions [root, join_1, transfer] → 3 TVKs required.
    let records = vec![
      record_with_microcredits(1_000_000),
      record_with_microcredits(2_000_000),
    ];
    let signer = Address::<TestnetV0>::from_str(SIGNER_ADDRESS).unwrap();
    let tvks = fake_tvks(3);

    let root = create_transfer_private_batch_request::<TestnetV0>(
      1u16,
      3_000_000,
      SIGNER_ADDRESS,
      &records,
      Some(&signer),
      &tvks,
    )
    .expect("batch request should build with enough TVKs");

    // nested = [join_1, transfer]
    assert_eq!(root.nested_calls.len(), 2);

    // The single join's merged output (fed as the transfer's first input record)
    // must carry the nonce derived from the TVK at transition index 1 (root = 0).
    let transfer = &root.nested_calls[1];
    let expected_nonce = derive_join_output_nonce::<TestnetV0>(tvks[1]).unwrap();
    match &transfer.inputs[0] {
      Value::Record(rec) => assert_eq!(
        rec.nonce(),
        &expected_nonce,
        "merged record nonce must come from tvks[1], not tvks[0]"
      ),
      other => panic!("expected merged record as transfer input, got {:?}", other),
    }
  }

  #[test]
  fn test_batch_transfer_rejects_wrong_tvk_count() {
    // Three records → transitions [root, join_1, join_2, transfer] → 4 TVKs.
    let records = vec![
      record_with_microcredits(1_000_000),
      record_with_microcredits(2_000_000),
      record_with_microcredits(3_000_000),
    ];
    let signer = Address::<TestnetV0>::from_str(SIGNER_ADDRESS).unwrap();

    // Both under-supply (3) and over-supply (5) must be rejected with the exact-count error.
    for wrong_len in [3usize, 5usize] {
      let tvks = fake_tvks(wrong_len);
      let result = create_transfer_private_batch_request::<TestnetV0>(
        1u16,
        6_000_000,
        SIGNER_ADDRESS,
        &records,
        Some(&signer),
        &tvks,
      );

      match result {
        Err(AppError::BadRequest(msg)) => assert!(
          msg.contains("Unexpected number of TVKs") && msg.contains("expected 4"),
          "unexpected error message for len {wrong_len}: {msg}"
        ),
        other => panic!(
          "expected exact-count BadRequest for len {wrong_len}, got {:?}",
          other
        ),
      }
    }
  }

  #[test]
  fn test_batch_transfer_without_signer_skips_nested_calls() {
    // Without a signer address we cannot assemble merged records, so no nested
    // calls are built and TVKs are irrelevant.
    let records = vec![
      record_with_microcredits(1_000_000),
      record_with_microcredits(2_000_000),
    ];

    let root = create_transfer_private_batch_request::<TestnetV0>(
      1u16,
      3_000_000,
      SIGNER_ADDRESS,
      &records,
      None,
      &[],
    )
    .expect("batch request should build without a signer");

    assert!(root.nested_calls.is_empty());
  }

  // ---- Private stablecoin transfers (transfer_private / transfer_private_to_public) ----

  /// A Token.record for the stablecoin (owner address.private + amount u128.private).
  fn token_record(amount: u128) -> RecordContent {
    let mut data = HashMap::new();
    data.insert("amount".to_string(), format!("{}u128.private", amount));
    RecordContent {
      owner: format!("{}.private", SIGNER_ADDRESS),
      data,
      nonce: "3464614586029802535577209894878281774938899585256819212454902402155441681025group"
        .to_string(),
      version: 1,
    }
  }

  /// A well-formed `[MerkleProof; 2]` Leo literal, the shape the client PoC emits
  /// (`SealanceMerkleTree.formatMerkleProof`): two structs each with 16 field siblings.
  fn merkle_proof_literal() -> String {
    let leaf = |idx: u32| {
      let siblings = (0..16)
        .map(|s| format!("{}field", s))
        .collect::<Vec<_>>()
        .join(", ");
      format!("{{ siblings: [ {} ], leaf_index: {}u32 }}", siblings, idx)
    };
    format!("[ {}, {} ]", leaf(0), leaf(1))
  }

  #[test]
  fn test_transfer_token_private_builds_four_inputs() {
    let request = create_transfer_token_private_request::<TestnetV0>(
      1u16,
      USDCX_STABLECOIN_PROGRAM,
      1000,
      SIGNER_ADDRESS,
      &token_record(1000),
      &merkle_proof_literal(),
    )
    .expect("transfer_private request should build");

    assert_eq!(request.function_name.to_string(), "transfer_private");
    assert_eq!(request.inputs.len(), 4);
    assert_eq!(request.input_types.len(), 4);
    // 3rd input is the spent Token record; 4th is the proof plaintext.
    assert!(matches!(request.inputs[2], Value::Record(_)));
    assert!(matches!(request.inputs[3], Value::Plaintext(_)));
  }

  #[test]
  fn test_transfer_token_private_to_public_builds_four_inputs() {
    let request = create_transfer_token_private_to_public_request::<TestnetV0>(
      1u16,
      USAD_STABLECOIN_PROGRAM,
      1000,
      SIGNER_ADDRESS,
      &token_record(1000),
      &merkle_proof_literal(),
    )
    .expect("transfer_private_to_public request should build");

    assert_eq!(
      request.function_name.to_string(),
      "transfer_private_to_public"
    );
    assert_eq!(request.inputs.len(), 4);
    assert!(matches!(request.inputs[3], Value::Plaintext(_)));
  }

  #[test]
  fn test_transfer_token_private_rejects_malformed_proof() {
    let result = create_transfer_token_private_request::<TestnetV0>(
      1u16,
      USDCX_STABLECOIN_PROGRAM,
      1000,
      SIGNER_ADDRESS,
      &token_record(1000),
      "not a merkle proof",
    );
    assert!(matches!(result, Err(AppError::BadRequest(_))));
  }

  #[test]
  fn test_transfer_token_private_rejects_non_stablecoin_program() {
    let result = create_transfer_token_private_request::<TestnetV0>(
      1u16,
      CREDITS_PROGRAM,
      1000,
      SIGNER_ADDRESS,
      &token_record(1000),
      &merkle_proof_literal(),
    );
    assert!(matches!(result, Err(AppError::InvalidIntent(_))));
  }

  // ---- Batch private stablecoin transfers (transfer_token_private_N / _to_public_N) ----

  #[test]
  fn test_token_batch_private_root_and_nested_shape() {
    // 2 records → root + [join_1, transfer] → 3 TVKs.
    let records = vec![token_record(1000), token_record(2000)];
    let signer = Address::<TestnetV0>::from_str(SIGNER_ADDRESS).unwrap();
    let tvks = fake_tvks(3);

    let root = create_transfer_token_private_batch_request::<TestnetV0>(
      1u16,
      TEST_USDCX_STABLECOIN_PROGRAM,
      3000,
      SIGNER_ADDRESS,
      &records,
      &merkle_proof_literal(),
      Some(&signer),
      &tvks,
    )
    .expect("token batch request should build");

    // Root: batcher program, N records + recipient + amount + proof = 5 inputs.
    assert_eq!(root.program_id.to_string(), USDCX_BATCHER_P_28_PROGRAM);
    assert_eq!(root.function_name.to_string(), "transfer_private_2");
    assert_eq!(root.inputs.len(), 5);
    assert!(
      matches!(root.inputs[4], Value::Plaintext(_)),
      "last root input is the proof"
    );
    // The batcher declares a constructor, so the root carries a checksum.
    assert!(root.program_checksum.is_some());

    // Nested: [join_1, transfer]. Transfer order is (recipient, amount, merged_token, proof).
    assert_eq!(root.nested_calls.len(), 2);
    let join = &root.nested_calls[0];
    assert_eq!(join.function_name.to_string(), "join");
    assert!(
      join.program_checksum.is_some(),
      "nested stablecoin call must carry its checksum"
    );

    let transfer = &root.nested_calls[1];
    assert_eq!(transfer.function_name.to_string(), "transfer_private");
    assert_eq!(transfer.inputs.len(), 4);
    assert!(matches!(transfer.inputs[0], Value::Plaintext(_))); // recipient
    assert!(matches!(transfer.inputs[2], Value::Record(_))); // merged token
    assert!(matches!(transfer.inputs[3], Value::Plaintext(_))); // proof
    assert!(transfer.program_checksum.is_some());

    // Merged record nonce must come from the join transition's TVK (index 1, root = 0).
    let expected_nonce = derive_join_output_nonce::<TestnetV0>(tvks[1]).unwrap();
    match &transfer.inputs[2] {
      Value::Record(rec) => assert_eq!(rec.nonce(), &expected_nonce),
      other => panic!("expected merged record, got {:?}", other),
    }
  }

  #[test]
  fn test_token_batch_p2p_max_records_routes_to_1113() {
    // 13 records → ldg_usdcx_p2p_1113 / transfer_private_to_public_13, 14 transitions.
    let records: Vec<RecordContent> = (0..13).map(|i| token_record(1000 + i as u128)).collect();
    let signer = Address::<TestnetV0>::from_str(SIGNER_ADDRESS).unwrap();
    let tvks = fake_tvks(14);

    let root = create_transfer_token_private_to_public_batch_request::<TestnetV0>(
      1u16,
      TEST_USDCX_STABLECOIN_PROGRAM,
      13_013,
      SIGNER_ADDRESS,
      &records,
      &merkle_proof_literal(),
      Some(&signer),
      &tvks,
    )
    .expect("13-record p2p batch should build");

    assert_eq!(root.program_id.to_string(), USDCX_BATCHER_P2P_1113_PROGRAM);
    assert_eq!(
      root.function_name.to_string(),
      "transfer_private_to_public_13"
    );
    assert_eq!(root.inputs.len(), 16); // 13 records + recipient + amount + proof
    assert_eq!(root.nested_calls.len(), 13); // 12 joins + 1 transfer
  }

  #[test]
  fn test_token_batch_mainnet_source_resolves() {
    // Same batcher program ID as testnet but mainnet source; checksum must still compute.
    let records = vec![token_record(1000), token_record(2000)];
    let signer = Address::<snarkvm::prelude::MainnetV0>::from_str(SIGNER_ADDRESS).unwrap();
    let tvks: Vec<Field<snarkvm::prelude::MainnetV0>> =
      (0..3).map(|k| Field::from_u64(k as u64 + 7)).collect();

    let root = create_transfer_token_private_batch_request::<snarkvm::prelude::MainnetV0>(
      0u16,
      USDCX_STABLECOIN_PROGRAM,
      3000,
      SIGNER_ADDRESS,
      &records,
      &merkle_proof_literal(),
      Some(&signer),
      &tvks,
    )
    .expect("mainnet token batch should resolve mainnet batcher source");

    assert_eq!(root.program_id.to_string(), USDCX_BATCHER_P_28_PROGRAM);
    assert!(root.program_checksum.is_some());
  }

  #[test]
  fn test_token_batch_usad_testnet_routes_to_usad_batcher() {
    // USAD stablecoin (testnet) must route to the USAD batcher set and resolve its testnet source.
    let records = vec![token_record(1000), token_record(2000)];
    let signer = Address::<TestnetV0>::from_str(SIGNER_ADDRESS).unwrap();
    let tvks = fake_tvks(3);

    let root = create_transfer_token_private_batch_request::<TestnetV0>(
      1u16,
      TEST_USAD_STABLECOIN_PROGRAM,
      3000,
      SIGNER_ADDRESS,
      &records,
      &merkle_proof_literal(),
      Some(&signer),
      &tvks,
    )
    .expect("usad token batch request should build");

    assert_eq!(root.program_id.to_string(), USAD_BATCHER_P_28_PROGRAM);
    assert_eq!(root.function_name.to_string(), "transfer_private_2");
    assert!(root.program_checksum.is_some());
  }

  #[test]
  fn test_token_batch_usad_mainnet_source_resolves() {
    // Same USAD batcher program ID as testnet but mainnet source; checksum must still compute.
    let records = vec![token_record(1000), token_record(2000)];
    let signer = Address::<snarkvm::prelude::MainnetV0>::from_str(SIGNER_ADDRESS).unwrap();
    let tvks: Vec<Field<snarkvm::prelude::MainnetV0>> =
      (0..3).map(|k| Field::from_u64(k as u64 + 7)).collect();

    let root = create_transfer_token_private_batch_request::<snarkvm::prelude::MainnetV0>(
      0u16,
      USAD_STABLECOIN_PROGRAM,
      3000,
      SIGNER_ADDRESS,
      &records,
      &merkle_proof_literal(),
      Some(&signer),
      &tvks,
    )
    .expect("mainnet usad token batch should resolve mainnet batcher source");

    assert_eq!(root.program_id.to_string(), USAD_BATCHER_P_28_PROGRAM);
    assert!(root.program_checksum.is_some());
  }

  #[test]
  fn test_token_batch_usad_p2p_910_testnet_source_resolves() {
    // 9 records → ldg_usad_p2p_910 / transfer_private_to_public_9. Forces resolution of the
    // testnet p2p source file the user supplied (`test_ldg_usad_p2p_910.aleo`) and its checksum.
    let records: Vec<RecordContent> = (0..9).map(|i| token_record(1000 + i as u128)).collect();
    let signer = Address::<TestnetV0>::from_str(SIGNER_ADDRESS).unwrap();
    let tvks = fake_tvks(10);

    let root = create_transfer_token_private_to_public_batch_request::<TestnetV0>(
      1u16,
      TEST_USAD_STABLECOIN_PROGRAM,
      9_009,
      SIGNER_ADDRESS,
      &records,
      &merkle_proof_literal(),
      Some(&signer),
      &tvks,
    )
    .expect("9-record usad p2p batch should build and resolve testnet source");

    assert_eq!(root.program_id.to_string(), USAD_BATCHER_P2P_910_PROGRAM);
    assert_eq!(
      root.function_name.to_string(),
      "transfer_private_to_public_9"
    );
    assert!(root.program_checksum.is_some());
  }

  #[test]
  fn test_token_batch_rejects_wrong_tvk_count() {
    let records = vec![token_record(1000), token_record(2000), token_record(3000)];
    let signer = Address::<TestnetV0>::from_str(SIGNER_ADDRESS).unwrap();
    // 3 records → 4 TVKs expected.
    let result = create_transfer_token_private_batch_request::<TestnetV0>(
      1u16,
      TEST_USDCX_STABLECOIN_PROGRAM,
      6000,
      SIGNER_ADDRESS,
      &records,
      &merkle_proof_literal(),
      Some(&signer),
      &fake_tvks(3),
    );
    match result {
      Err(AppError::BadRequest(msg)) => {
        assert!(msg.contains("Unexpected number of TVKs") && msg.contains("expected 4"))
      }
      other => panic!("expected exact-count BadRequest, got {:?}", other),
    }
  }

  #[test]
  fn test_token_batch_rejects_mixed_owners() {
    let mut other = token_record(2000);
    other.owner =
      "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc.private".to_string();
    let records = vec![token_record(1000), other];
    let signer = Address::<TestnetV0>::from_str(SIGNER_ADDRESS).unwrap();

    let result = create_transfer_token_private_batch_request::<TestnetV0>(
      1u16,
      TEST_USDCX_STABLECOIN_PROGRAM,
      3000,
      SIGNER_ADDRESS,
      &records,
      &merkle_proof_literal(),
      Some(&signer),
      &fake_tvks(3),
    );
    assert!(matches!(result, Err(AppError::InvalidIntent(_))));
  }

  #[test]
  fn test_token_batch_root_tlv_encodes() {
    // Exercises the TLV encoder for the new root input types — notably the program-qualified
    // external `[<stablecoin>/MerkleProof; 2u32].private` array, which neither the credits batcher
    // (no proof) nor the single-record stablecoin transfer (local proof type) produced. Device-free
    // proof that `get_input_type_bytes`/`encode_input_value` handle this combination.
    let records = vec![token_record(1000), token_record(2000)];
    let signer = Address::<TestnetV0>::from_str(SIGNER_ADDRESS).unwrap();
    let root = create_transfer_token_private_batch_request::<TestnetV0>(
      1u16,
      TEST_USDCX_STABLECOIN_PROGRAM,
      3000,
      SIGNER_ADDRESS,
      &records,
      &merkle_proof_literal(),
      Some(&signer),
      &fake_tvks(3),
    )
    .expect("token batch request should build");

    // Encode the root inputs directly (root records are ExternalRecord → no commitments needed).
    // This drives get_input_type_bytes/encode_input_value over the external Token records and the
    // program-qualified external `[<stablecoin>/MerkleProof; 2u32]` array.
    let encoded = crate::core::tlv::v1::encode_request_tlv::<TestnetV0>(&root, &[]);
    assert!(
      encoded.is_ok(),
      "TLV encoding of token batch root failed: {:?}",
      encoded.err()
    );
    assert!(!encoded.unwrap().is_empty());
  }

  #[test]
  fn test_token_batch_rejects_too_many_records() {
    let records: Vec<RecordContent> = (0..14).map(|i| token_record(1000 + i as u128)).collect();
    let signer = Address::<TestnetV0>::from_str(SIGNER_ADDRESS).unwrap();
    let result = create_transfer_token_private_batch_request::<TestnetV0>(
      1u16,
      TEST_USDCX_STABLECOIN_PROGRAM,
      14_000,
      SIGNER_ADDRESS,
      &records,
      &merkle_proof_literal(),
      Some(&signer),
      &fake_tvks(15),
    );
    assert!(matches!(result, Err(AppError::BadRequest(_))));
  }
}
