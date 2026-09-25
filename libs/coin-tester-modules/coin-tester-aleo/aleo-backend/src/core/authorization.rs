//! Authorization service for creating Aleo authorizations from signed requests
//!
//! This module implements the logic to convert signed prepared requests into
//! Aleo authorizations that can be broadcast to the network.

use std::collections::VecDeque;
use std::str::FromStr;

use crate::AppResult;
use crate::core::intent_utils::compute_record_commitment;
use crate::error::AppError;
use anyhow::{anyhow, bail, ensure};
use crypto_box::aead::OsRng;
use snarkvm::circuit::Aleo;
use snarkvm::console::account::{ComputeKey, GraphKey, ViewKey};
use snarkvm::console::network::Network;
use snarkvm::console::program::{
  Identifier, InputID, ProgramID, Request, Value, ValueType, compute_function_id,
};
use snarkvm::console::types::{Address, Field, U16};
use snarkvm::prelude::{Authorization, CryptoRng, Plaintext, Program, Record, Rng, ToFields};
use snarkvm::synthesizer::process::{CallStack, Process, Stack};
use snarkvm::synthesizer::program::StackTrait;

use super::evaluate::{PreloadedCallStack, custom_evaluate_function};
use super::types::{PreparedRequest, RequestSignature, SignedRequest};

/// Reconstruct a snarkVM Request from a signed prepared request, using the signature data
/// (tvk, tpk, gammas) to compute the input IDs.
#[allow(clippy::too_many_arguments)]
pub fn assemble_request<N: Network>(
  compute_key: &ComputeKey<N>,
  view_key: &ViewKey<N>,
  signature: &RequestSignature<N>,
  program_id: ProgramID<N>,
  function_name: Identifier<N>,
  inputs: impl ExactSizeIterator<Item = impl TryInto<Value<N>>>,
  input_types: &[ValueType<N>],
  root_tvk: Option<Field<N>>,
) -> anyhow::Result<Request<N>> {
  if input_types.len() != inputs.len() {
    bail!(
      "'{program_id}/{function_name}' expects {} inputs, but {} were provided.",
      input_types.len(),
      inputs.len()
    )
  }

  let sk_tag = GraphKey::try_from(view_key)?.sk_tag();
  let signer = Address::try_from(compute_key)?;
  let tvk = signature.tvk;

  // tcm = Hash(tvk)
  let tcm = N::hash_psd2(&[tvk])?;

  // scm = Hash(signer || root_tvk)
  let root_tvk = root_tvk.unwrap_or(tvk);
  let scm = N::hash_psd2(&[signer.to_x_coordinate(), root_tvk])?;

  let network_id = U16::new(N::ID);
  let function_id = compute_function_id(&network_id, &program_id, &function_name)?;

  let mut prepared_inputs = Vec::with_capacity(inputs.len());
  let mut input_ids = Vec::with_capacity(inputs.len());
  let mut gammas: std::collections::VecDeque<_> = signature.gammas.iter().copied().collect();

  for (index, (input, input_type)) in inputs.zip(input_types.iter()).enumerate() {
    let input = input.try_into().map_err(|_| {
      anyhow!("Failed to parse input #{index} ('{input_type}') for '{program_id}/{function_name}'")
    })?;

    prepared_inputs.push(input.clone());

    match input_type {
      // A constant input is hashed (using `tcm`) to a field element
      ValueType::Constant(..) => {
        ensure!(
          matches!(input, Value::Plaintext(..)),
          "Expected a plaintext input"
        );

        let index =
          Field::from_u16(u16::try_from(index).map_err(|_| anyhow!("Input index exceeds u16"))?);
        let mut preimage = Vec::new();
        preimage.push(function_id);
        preimage.extend(input.to_fields()?);
        preimage.push(tcm);
        preimage.push(index);
        let input_hash = N::hash_psd8(&preimage)?;
        input_ids.push(InputID::Constant(input_hash));
      }
      // A public input is hashed (using `tcm`) to a field element
      ValueType::Public(..) => {
        ensure!(
          matches!(input, Value::Plaintext(..)),
          "Expected a plaintext input"
        );

        let index =
          Field::from_u16(u16::try_from(index).map_err(|_| anyhow!("Input index exceeds u16"))?);
        let mut preimage = Vec::new();
        preimage.push(function_id);
        preimage.extend(input.to_fields()?);
        preimage.push(tcm);
        preimage.push(index);
        let input_hash = N::hash_psd8(&preimage)?;
        input_ids.push(InputID::Public(input_hash));
      }
      // A private input is encrypted (using `tvk`) and hashed to a field element
      ValueType::Private(..) => {
        ensure!(
          matches!(input, Value::Plaintext(..)),
          "Expected a plaintext input"
        );

        let index =
          Field::from_u16(u16::try_from(index).map_err(|_| anyhow!("Input index exceeds u16"))?);
        let input_view_key = N::hash_psd4(&[function_id, tvk, index])?;
        let ciphertext = match &input {
          Value::Plaintext(plaintext) => plaintext.encrypt_symmetric(input_view_key)?,
          Value::Record(..) => bail!("Expected a plaintext input, found a record input"),
          Value::Future(..) => bail!("Expected a plaintext input, found a future input"),
        };
        let input_hash = N::hash_psd8(&ciphertext.to_fields()?)?;
        input_ids.push(InputID::Private(input_hash));
      }
      // A record input is computed to its serial number
      ValueType::Record(record_name) => {
        let record = match &input {
          Value::Record(record) => record,
          Value::Plaintext(..) => bail!("Expected a record input, found a plaintext input"),
          Value::Future(..) => bail!("Expected a record input, found a future input"),
        };

        ensure!(
          **record.owner() == signer,
          "Input record for '{program_id}' must belong to the signer"
        );

        let (commitment, record_view_key) =
          compute_record_commitment(record, record_name, &program_id, view_key)?;

        let gamma = gammas.pop_front().ok_or_else(|| {
          anyhow!("Insufficient number of gammas provided in the request signature")
        })?;

        let serial_number =
          Record::<N, Plaintext<N>>::serial_number_from_gamma(&gamma, commitment)?;
        let tag = Record::<N, Plaintext<N>>::tag(sk_tag, commitment)?;

        input_ids.push(InputID::Record(
          commitment,
          gamma,
          record_view_key,
          serial_number,
          tag,
        ));
      }
      // An external record input is hashed (using `tvk`) to a field element
      ValueType::ExternalRecord(..) => {
        ensure!(
          matches!(input, Value::Record(..)),
          "Expected a record input"
        );

        let index =
          Field::from_u16(u16::try_from(index).map_err(|_| anyhow!("Input index exceeds u16"))?);
        let mut preimage = Vec::new();
        preimage.push(function_id);
        preimage.extend(input.to_fields()?);
        preimage.push(tvk);
        preimage.push(index);
        let input_hash = N::hash_psd8(&preimage)?;
        input_ids.push(InputID::ExternalRecord(input_hash));
      }
      ValueType::Future(..) => bail!("A future is not a valid input"),
    }
  }

  Ok(Request::from((
    signer,
    network_id,
    program_id,
    function_name,
    input_ids,
    prepared_inputs,
    signature.signature,
    sk_tag,
    tvk,
    tcm,
    scm,
  )))
}

/// Authorize a signed request, producing an Authorization that can execute the transaction.
pub fn authorize_signed_request<N: Network + 'static, A: Aleo<Network = N>, R: Rng + CryptoRng>(
  process: &Process<N>,
  compute_key: &ComputeKey<N>,
  view_key: &ViewKey<N>,
  signed_request: &SignedRequest<N>,
  rng: &mut R,
) -> anyhow::Result<Authorization<N>> {
  let program_id = signed_request.source.program_id;
  process
    .get_stack(program_id)?
    .authorize_signed_request_impl::<A, R>(compute_key, view_key, signed_request, rng)
}

/// Extension trait for Stack to authorize signed requests
trait StackAuthorize<N: Network> {
  fn authorize_signed_request_impl<A: Aleo<Network = N>, R: Rng + CryptoRng>(
    &self,
    compute_key: &ComputeKey<N>,
    view_key: &ViewKey<N>,
    signed_request: &SignedRequest<N>,
    rng: &mut R,
  ) -> anyhow::Result<Authorization<N>>;
}

impl<N: Network> StackAuthorize<N> for Stack<N> {
  fn authorize_signed_request_impl<A: Aleo<Network = N>, R: Rng + CryptoRng>(
    &self,
    compute_key: &ComputeKey<N>,
    view_key: &ViewKey<N>,
    signed_request: &SignedRequest<N>,
    rng: &mut R,
  ) -> anyhow::Result<Authorization<N>> {
    let program_id = signed_request.source.program_id;
    let function_name = signed_request.source.function_name;

    let input_types = self.get_function(&function_name)?.input_types();

    // The root request has no caller.
    let caller = None;

    let root_request = assemble_request(
      compute_key,
      view_key,
      &signed_request.signature,
      program_id,
      function_name,
      signed_request.source.inputs.iter().cloned(),
      &input_types,
      None, // root_tvk is None for the root request itself
    )?;

    let authorization = Authorization::new(root_request.clone());

    // The root_tvk to pass to nested calls is the tvk of the root request
    let root_tvk = Some(signed_request.signature.tvk);

    let has_nested_calls = !signed_request.source.nested_calls.is_empty();

    // Always assemble nested requests to populate authorization.requests
    let ctx = AssemblyCtx {
      compute_key,
      view_key,
      root_tvk,
    };
    let mut all_requests = vec![root_request.clone()];
    ctx.assemble_nested_requests(
      &signed_request.source.nested_calls,
      &signed_request.signature.nested_calls,
      &mut all_requests,
      &authorization,
    )?;

    if has_nested_calls {
      // Batcher path: function body contains `call` instructions; use custom evaluator.
      let mut entries = VecDeque::new();
      ctx.collect_entries(
        root_request,
        input_types,
        &signed_request.source.nested_calls,
        &signed_request.signature.nested_calls,
        &mut entries,
      )?;
      let mut pcs = PreloadedCallStack {
        entries,
        authorization: authorization.clone(),
      };
      custom_evaluate_function::<N, A, R>(self, &mut pcs, caller, root_tvk, rng)?;
    } else {
      // Simple program: no body-level function calls; existing path works.
      all_requests.reverse();
      let call_stack = CallStack::Authorize(all_requests, None, authorization.clone());
      self.evaluate_function::<A, R>(call_stack, caller, root_tvk, rng)?;
    }

    Ok(authorization)
  }
}

/// Context shared across all levels of nested request assembly.
///
/// Groups the three parameters that never change during recursion so they do not need
/// to be threaded through every call site individually.
struct AssemblyCtx<'a, N: Network> {
  compute_key: &'a ComputeKey<N>,
  view_key: &'a ViewKey<N>,
  root_tvk: Option<Field<N>>,
}

impl<'a, N: Network> AssemblyCtx<'a, N> {
  /// Recursively assemble nested requests and add them to the authorization.
  fn assemble_nested_requests(
    &self,
    nested_sources: &[PreparedRequest<N>],
    nested_signatures: &[RequestSignature<N>],
    all_requests: &mut Vec<Request<N>>,
    authorization: &Authorization<N>,
  ) -> anyhow::Result<()> {
    if nested_sources.len() != nested_signatures.len() {
      bail!(
        "Mismatched number of nested calls ({}) and nested signatures ({})",
        nested_sources.len(),
        nested_signatures.len()
      );
    }

    for (nested_source, nested_sig) in nested_sources.iter().zip(nested_signatures.iter()) {
      let nested_request = assemble_request(
        self.compute_key,
        self.view_key,
        nested_sig,
        nested_source.program_id,
        nested_source.function_name,
        nested_source.inputs.iter().cloned(),
        &nested_source.input_types,
        self.root_tvk,
      )?;

      authorization
        .push(nested_request.clone())
        .map_err(|e| anyhow!("Failed to push nested request to authorization: {}", e))?;
      all_requests.push(nested_request);

      self.assemble_nested_requests(
        &nested_source.nested_calls,
        &nested_sig.nested_calls,
        all_requests,
        authorization,
      )?;
    }

    Ok(())
  }

  /// Build a DFS pre-order list of (request, input_types) pairs for custom_evaluate_function.
  ///
  /// Mirrors assemble_nested_requests but collects into a VecDeque instead of pushing to
  /// the authorization. root_tvk is propagated unchanged at every level.
  fn collect_entries(
    &self,
    request: Request<N>,
    input_types: Vec<ValueType<N>>,
    nested_sources: &[PreparedRequest<N>],
    nested_signatures: &[RequestSignature<N>],
    entries: &mut VecDeque<(Request<N>, Vec<ValueType<N>>)>,
  ) -> anyhow::Result<()> {
    entries.push_back((request, input_types));
    for (src, sig) in nested_sources.iter().zip(nested_signatures.iter()) {
      let nested_input_types = src.input_types.clone();
      let nested_req = assemble_request(
        self.compute_key,
        self.view_key,
        sig,
        src.program_id,
        src.function_name,
        src.inputs.iter().cloned(),
        &nested_input_types,
        self.root_tvk,
      )?;
      self.collect_entries(
        nested_req,
        nested_input_types,
        &src.nested_calls,
        &sig.nested_calls,
        entries,
      )?;
    }
    Ok(())
  }
}

/// Returns the 4-program USDCx stablecoin import chain (merkle_tree → multisig → freezelist →
/// stablecoin) for the given network. USDCx batchers prepend this chain before their own source.
fn usdcx_stablecoin_chain(is_testnet: bool) -> Vec<&'static str> {
  if is_testnet {
    vec![
      include_str!("../../contracts/merkle_tree.aleo"),
      include_str!("../../contracts/test_usdcx_multisig_core.aleo"),
      include_str!("../../contracts/test_usdcx_freezelist.aleo"),
      include_str!("../../contracts/test_usdcx_stablecoin.aleo"),
    ]
  } else {
    vec![
      include_str!("../../contracts/merkle_tree.aleo"),
      include_str!("../../contracts/usdcx_multisig_core.aleo"),
      include_str!("../../contracts/usdcx_freezelist.aleo"),
      include_str!("../../contracts/usdcx_stablecoin.aleo"),
    ]
  }
}

/// Returns the full program chain for a USDCx batcher: the shared stablecoin chain plus the
/// batcher program itself, selecting mainnet or testnet sources by `is_testnet`.
fn usdcx_batcher_chain(
  is_testnet: bool,
  mainnet_src: &'static str,
  testnet_src: &'static str,
) -> Vec<&'static str> {
  let mut coin_programs_chain = usdcx_stablecoin_chain(is_testnet);
  coin_programs_chain.push(if is_testnet { testnet_src } else { mainnet_src });
  coin_programs_chain
}

/// Returns the 4-program USAD stablecoin import chain (merkle_tree → multisig → freezelist →
/// stablecoin) for the given network. USAD batchers prepend this chain before their own source.
fn usad_stablecoin_chain(is_testnet: bool) -> Vec<&'static str> {
  if is_testnet {
    vec![
      include_str!("../../contracts/merkle_tree.aleo"),
      include_str!("../../contracts/test_usad_multisig_core.aleo"),
      include_str!("../../contracts/test_usad_freezelist.aleo"),
      include_str!("../../contracts/test_usad_stablecoin.aleo"),
    ]
  } else {
    vec![
      include_str!("../../contracts/merkle_tree.aleo"),
      include_str!("../../contracts/usad_multisig_core.aleo"),
      include_str!("../../contracts/usad_freezelist.aleo"),
      include_str!("../../contracts/usad_stablecoin.aleo"),
    ]
  }
}

/// Returns the full program chain for a USAD batcher: the shared stablecoin chain plus the
/// batcher program itself, selecting mainnet or testnet sources by `is_testnet`.
fn usad_batcher_chain(
  is_testnet: bool,
  mainnet_src: &'static str,
  testnet_src: &'static str,
) -> Vec<&'static str> {
  let mut coin_programs_chain = usad_stablecoin_chain(is_testnet);
  coin_programs_chain.push(if is_testnet { testnet_src } else { mainnet_src });
  coin_programs_chain
}

/// Program sources (in dependency order) that must be registered into the `Process` to
/// authorize a request whose root program is `program_id`. `credits.aleo` is built into
/// `Process::load()`, and the credits ledger-batcher programs (`ldg_p_*`) import only credits, so
/// each needs only itself; the stablecoins and their token batchers (USDCx, USAD) need their full
/// import chain. Stablecoin token batchers use different source on testnet (network_id=1) vs
/// mainnet (network_id=0).
fn programs_to_register(program_id: &str, network_id: u16) -> Vec<&'static str> {
  use crate::core::intent::{
    LDGBATCHER_28_PROGRAM, LDGBATCHER_910_PROGRAM, LDGBATCHER_1114_PROGRAM,
    LDGBATCHER_PPUB_28_PROGRAM, LDGBATCHER_PPUB_910_PROGRAM, LDGBATCHER_PPUB_1114_PROGRAM,
    TEST_USAD_STABLECOIN_PROGRAM, TEST_USDCX_STABLECOIN_PROGRAM, USAD_BATCHER_P_28_PROGRAM,
    USAD_BATCHER_P_910_PROGRAM, USAD_BATCHER_P_1113_PROGRAM, USAD_BATCHER_P2P_28_PROGRAM,
    USAD_BATCHER_P2P_910_PROGRAM, USAD_BATCHER_P2P_1113_PROGRAM, USAD_STABLECOIN_PROGRAM,
    USDCX_BATCHER_P_28_PROGRAM, USDCX_BATCHER_P_910_PROGRAM, USDCX_BATCHER_P_1113_PROGRAM,
    USDCX_BATCHER_P2P_28_PROGRAM, USDCX_BATCHER_P2P_910_PROGRAM, USDCX_BATCHER_P2P_1113_PROGRAM,
    USDCX_STABLECOIN_PROGRAM,
  };

  // TestnetV0::ID = 1
  let is_testnet = network_id == 1;

  match program_id {
    // Credits batchers import only credits (built-in): register just themselves.
    LDGBATCHER_28_PROGRAM => vec![include_str!("../../contracts/ldg_p_28.aleo")],
    LDGBATCHER_910_PROGRAM => vec![include_str!("../../contracts/ldg_p_910.aleo")],
    LDGBATCHER_1114_PROGRAM => vec![include_str!("../../contracts/ldg_p_1114.aleo")],
    LDGBATCHER_PPUB_28_PROGRAM => vec![include_str!("../../contracts/ldg_p2p_28.aleo")],
    LDGBATCHER_PPUB_910_PROGRAM => vec![include_str!("../../contracts/ldg_p2p_910.aleo")],
    LDGBATCHER_PPUB_1114_PROGRAM => vec![include_str!("../../contracts/ldg_p2p_1114.aleo")],
    // Stablecoin direct calls need their full import chain.
    USAD_STABLECOIN_PROGRAM => usad_stablecoin_chain(false),
    TEST_USAD_STABLECOIN_PROGRAM => usad_stablecoin_chain(true),
    USDCX_STABLECOIN_PROGRAM => usdcx_stablecoin_chain(false),
    TEST_USDCX_STABLECOIN_PROGRAM => usdcx_stablecoin_chain(true),
    // USDCx batchers: shared stablecoin chain + the batcher itself (network-specific source).
    USDCX_BATCHER_P_28_PROGRAM => usdcx_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usdcx_p_28.aleo"),
      include_str!("../../contracts/test_ldg_usdcx_p_28.aleo"),
    ),
    USDCX_BATCHER_P_910_PROGRAM => usdcx_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usdcx_p_910.aleo"),
      include_str!("../../contracts/test_ldg_usdcx_p_910.aleo"),
    ),
    USDCX_BATCHER_P_1113_PROGRAM => usdcx_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usdcx_p_1113.aleo"),
      include_str!("../../contracts/test_ldg_usdcx_p_1113.aleo"),
    ),
    USDCX_BATCHER_P2P_28_PROGRAM => usdcx_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usdcx_p2p_28.aleo"),
      include_str!("../../contracts/test_ldg_usdcx_p2p_28.aleo"),
    ),
    USDCX_BATCHER_P2P_910_PROGRAM => usdcx_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usdcx_p2p_910.aleo"),
      include_str!("../../contracts/test_ldg_usdcx_p2p_910.aleo"),
    ),
    USDCX_BATCHER_P2P_1113_PROGRAM => usdcx_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usdcx_p2p_1113.aleo"),
      include_str!("../../contracts/test_ldg_usdcx_p2p_1113.aleo"),
    ),
    // USAD batchers: shared stablecoin chain + the batcher itself (network-specific source).
    USAD_BATCHER_P_28_PROGRAM => usad_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usad_p_28.aleo"),
      include_str!("../../contracts/test_ldg_usad_p_28.aleo"),
    ),
    USAD_BATCHER_P_910_PROGRAM => usad_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usad_p_910.aleo"),
      include_str!("../../contracts/test_ldg_usad_p_910.aleo"),
    ),
    USAD_BATCHER_P_1113_PROGRAM => usad_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usad_p_1113.aleo"),
      include_str!("../../contracts/test_ldg_usad_p_1113.aleo"),
    ),
    USAD_BATCHER_P2P_28_PROGRAM => usad_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usad_p2p_28.aleo"),
      include_str!("../../contracts/test_ldg_usad_p2p_28.aleo"),
    ),
    USAD_BATCHER_P2P_910_PROGRAM => usad_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usad_p2p_910.aleo"),
      include_str!("../../contracts/test_ldg_usad_p2p_910.aleo"),
    ),
    USAD_BATCHER_P2P_1113_PROGRAM => usad_batcher_chain(
      is_testnet,
      include_str!("../../contracts/ldg_usad_p2p_1113.aleo"),
      include_str!("../../contracts/test_ldg_usad_p2p_1113.aleo"),
    ),
    _ => vec![],
  }
}

/// Build the snarkVM `Process` for an authorization, registering only the programs the
/// request's root program needs (see [`programs_to_register`]).
fn build_process<N: Network>(signed_request: &SignedRequest<N>) -> AppResult<Process<N>> {
  let mut process = Process::<N>::load()
    .map_err(|e| AppError::AuthorizationFailed(format!("Failed to load process: {}", e)))?;
  for src in programs_to_register(&signed_request.source.program_id.to_string(), N::ID) {
    process.add_program(&Program::from_str(src)?)?;
  }
  Ok(process)
}

/// Create an authorization from API request data for MainnetV0
pub fn create_authorization_mainnet(
  signed_request: &SignedRequest<snarkvm::prelude::MainnetV0>,
  view_key_str: &str,
  compute_key: &ComputeKey<snarkvm::prelude::MainnetV0>,
) -> AppResult<(Authorization<snarkvm::prelude::MainnetV0>, String)> {
  use snarkvm::prelude::MainnetV0;

  let view_key = ViewKey::<MainnetV0>::from_str(view_key_str)
    .map_err(|e| AppError::InvalidSignature(format!("Invalid view key: {}", e)))?;

  let process = build_process(signed_request)?;
  let mut rng = OsRng;

  let authorization = authorize_signed_request::<MainnetV0, snarkvm::circuit::AleoV0, _>(
    &process,
    compute_key,
    &view_key,
    signed_request,
    &mut rng,
  )
  .map_err(|e| AppError::AuthorizationFailed(format!("Authorization failed: {}", e)))?;

  let execution_id = authorization
    .to_execution_id()
    .map_err(|e| AppError::AuthorizationFailed(format!("Failed to get execution ID: {}", e)))?
    .to_string();

  Ok((authorization, execution_id))
}

/// Create an authorization from API request data for TestnetV0
pub fn create_authorization_testnet(
  signed_request: &SignedRequest<snarkvm::prelude::TestnetV0>,
  view_key_str: &str,
  compute_key: &ComputeKey<snarkvm::prelude::TestnetV0>,
) -> AppResult<(Authorization<snarkvm::prelude::TestnetV0>, String)> {
  use snarkvm::prelude::TestnetV0;

  let view_key = ViewKey::<TestnetV0>::from_str(view_key_str)
    .map_err(|e| AppError::InvalidSignature(format!("Invalid view key: {}", e)))?;

  let process = build_process(signed_request)?;
  let mut rng = OsRng;

  let authorization = authorize_signed_request::<TestnetV0, snarkvm::circuit::AleoTestnetV0, _>(
    &process,
    compute_key,
    &view_key,
    signed_request,
    &mut rng,
  )
  .map_err(|e| AppError::AuthorizationFailed(format!("Authorization failed: {}", e)))?;

  let execution_id = authorization
    .to_execution_id()
    .map_err(|e| AppError::AuthorizationFailed(format!("Failed to get execution ID: {}", e)))?
    .to_string();

  Ok((authorization, execution_id))
}

/// Create an authorization from API request data for CanaryV0
pub fn create_authorization_canary(
  signed_request: &SignedRequest<snarkvm::prelude::CanaryV0>,
  view_key_str: &str,
  compute_key: &ComputeKey<snarkvm::prelude::CanaryV0>,
) -> AppResult<(Authorization<snarkvm::prelude::CanaryV0>, String)> {
  use snarkvm::prelude::CanaryV0;

  let view_key = ViewKey::<CanaryV0>::from_str(view_key_str)
    .map_err(|e| AppError::InvalidSignature(format!("Invalid view key: {}", e)))?;

  let process = build_process(signed_request)?;
  let mut rng = OsRng;

  let authorization = authorize_signed_request::<CanaryV0, snarkvm::circuit::AleoCanaryV0, _>(
    &process,
    compute_key,
    &view_key,
    signed_request,
    &mut rng,
  )
  .map_err(|e| AppError::AuthorizationFailed(format!("Authorization failed: {}", e)))?;

  let execution_id = authorization
    .to_execution_id()
    .map_err(|e| AppError::AuthorizationFailed(format!("Failed to get execution ID: {}", e)))?
    .to_string();

  Ok((authorization, execution_id))
}

#[cfg(test)]
mod tests {
  use super::*;

  fn prog_ids(programs: &[&'static str]) -> Vec<&'static str> {
    programs
      .iter()
      .map(|src| {
        src
          .lines()
          .find(|l| l.starts_with("program "))
          .and_then(|l| l.strip_prefix("program ").and_then(|l| l.strip_suffix(';')))
          .unwrap_or("<unknown>")
      })
      .collect()
  }

  #[test]
  fn credits_batcher_registers_only_itself() {
    let programs = programs_to_register("ldg_p_28.aleo", 0);
    assert_eq!(programs.len(), 1);
    assert_eq!(prog_ids(&programs), vec!["ldg_p_28.aleo"]);
  }

  #[test]
  fn usdcx_stablecoin_mainnet_registers_full_chain() {
    let programs = programs_to_register("usdcx_stablecoin.aleo", 0);
    assert_eq!(
      prog_ids(&programs),
      vec![
        "merkle_tree.aleo",
        "usdcx_multisig_core.aleo",
        "usdcx_freezelist.aleo",
        "usdcx_stablecoin.aleo",
      ]
    );
  }

  #[test]
  fn test_usdcx_stablecoin_registers_test_chain() {
    let programs = programs_to_register("test_usdcx_stablecoin.aleo", 1);
    assert_eq!(
      prog_ids(&programs),
      vec![
        "merkle_tree.aleo",
        "test_usdcx_multisig_core.aleo",
        "test_usdcx_freezelist.aleo",
        "test_usdcx_stablecoin.aleo",
      ]
    );
  }

  #[test]
  fn usdcx_batcher_p_28_mainnet_registers_mainnet_chain() {
    let programs = programs_to_register("ldg_usdcx_p_28.aleo", 0);
    assert_eq!(
      prog_ids(&programs),
      vec![
        "merkle_tree.aleo",
        "usdcx_multisig_core.aleo",
        "usdcx_freezelist.aleo",
        "usdcx_stablecoin.aleo",
        "ldg_usdcx_p_28.aleo",
      ]
    );
  }

  #[test]
  fn usdcx_batcher_p_28_testnet_registers_test_chain() {
    let programs = programs_to_register("ldg_usdcx_p_28.aleo", 1);
    assert_eq!(
      prog_ids(&programs),
      vec![
        "merkle_tree.aleo",
        "test_usdcx_multisig_core.aleo",
        "test_usdcx_freezelist.aleo",
        "test_usdcx_stablecoin.aleo",
        "ldg_usdcx_p_28.aleo",
      ]
    );
  }

  #[test]
  fn usdcx_batcher_p2p_1113_testnet_registers_test_chain() {
    let programs = programs_to_register("ldg_usdcx_p2p_1113.aleo", 1);
    assert_eq!(
      prog_ids(&programs),
      vec![
        "merkle_tree.aleo",
        "test_usdcx_multisig_core.aleo",
        "test_usdcx_freezelist.aleo",
        "test_usdcx_stablecoin.aleo",
        "ldg_usdcx_p2p_1113.aleo",
      ]
    );
  }

  #[test]
  fn usad_stablecoin_mainnet_registers_full_chain() {
    let programs = programs_to_register("usad_stablecoin.aleo", 0);
    assert_eq!(
      prog_ids(&programs),
      vec![
        "merkle_tree.aleo",
        "usad_multisig_core.aleo",
        "usad_freezelist.aleo",
        "usad_stablecoin.aleo",
      ]
    );
  }

  #[test]
  fn test_usad_stablecoin_registers_test_chain() {
    let programs = programs_to_register("test_usad_stablecoin.aleo", 1);
    assert_eq!(
      prog_ids(&programs),
      vec![
        "merkle_tree.aleo",
        "test_usad_multisig_core.aleo",
        "test_usad_freezelist.aleo",
        "test_usad_stablecoin.aleo",
      ]
    );
  }

  #[test]
  fn usad_batcher_p_28_mainnet_registers_mainnet_chain() {
    let programs = programs_to_register("ldg_usad_p_28.aleo", 0);
    assert_eq!(
      prog_ids(&programs),
      vec![
        "merkle_tree.aleo",
        "usad_multisig_core.aleo",
        "usad_freezelist.aleo",
        "usad_stablecoin.aleo",
        "ldg_usad_p_28.aleo",
      ]
    );
  }

  #[test]
  fn usad_batcher_p_28_testnet_registers_test_chain() {
    let programs = programs_to_register("ldg_usad_p_28.aleo", 1);
    assert_eq!(
      prog_ids(&programs),
      vec![
        "merkle_tree.aleo",
        "test_usad_multisig_core.aleo",
        "test_usad_freezelist.aleo",
        "test_usad_stablecoin.aleo",
        "ldg_usad_p_28.aleo",
      ]
    );
  }

  #[test]
  fn usad_batcher_p2p_910_testnet_registers_test_chain() {
    let programs = programs_to_register("ldg_usad_p2p_910.aleo", 1);
    assert_eq!(
      prog_ids(&programs),
      vec![
        "merkle_tree.aleo",
        "test_usad_multisig_core.aleo",
        "test_usad_freezelist.aleo",
        "test_usad_stablecoin.aleo",
        "ldg_usad_p2p_910.aleo",
      ]
    );
  }

  #[test]
  fn unknown_program_registers_nothing() {
    let programs = programs_to_register("credits.aleo", 0);
    assert!(programs.is_empty());
  }

  /// The USAD batcher chains must actually parse and load into a `Process` (imports present and
  /// correctly ordered) — not merely exist as files. This mirrors `build_process` without a signed
  /// fixture, so a malformed or incomplete user-provided `test_usad_*`/`usad_*` contract fails here
  /// in CI rather than silently on the hardware device.
  #[test]
  fn usad_batcher_chains_parse_and_load_into_process() {
    use snarkvm::prelude::{MainnetV0, TestnetV0};

    // Testnet p2p/910 pulls in the test_usad_* chain + test_ldg_usad_p2p_910 source.
    let mut testnet_process = Process::<TestnetV0>::load().expect("load testnet process");
    for src in programs_to_register("ldg_usad_p2p_910.aleo", 1) {
      let program = Program::<TestnetV0>::from_str(src).expect("usad testnet program parses");
      testnet_process
        .add_program(&program)
        .expect("usad testnet program loads into process");
    }

    // Mainnet p_28 covers the non-test usad_* chain.
    let mut mainnet_process = Process::<MainnetV0>::load().expect("load mainnet process");
    for src in programs_to_register("ldg_usad_p_28.aleo", 0) {
      let program = Program::<MainnetV0>::from_str(src).expect("usad mainnet program parses");
      mainnet_process
        .add_program(&program)
        .expect("usad mainnet program loads into process");
    }
  }
}
