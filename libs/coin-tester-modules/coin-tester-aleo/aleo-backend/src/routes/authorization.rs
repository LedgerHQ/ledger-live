use std::str::FromStr;

use super::intent::NetworkId;
use crate::core::tlv::{TLVVersion, decode_signature};
use crate::core::{
  PreparedRequest as CorePreparedRequest, RequestSignature, SignedRequest,
  create_authorization_canary, create_authorization_mainnet, create_authorization_testnet,
  decode_from_hex, decode_vec_from_hex,
};
use crate::{ApiError, AppError, AppResult};
use salvo::oapi::ToSchema;
use salvo::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use snarkvm::console::network::Network;
use snarkvm::prelude::{CanaryV0, ComputeKey, MainnetV0, TestnetV0};
use tracing_opentelemetry::OpenTelemetrySpanExt;
use zeroize::Zeroize;

const MAX_NESTED_CALLS: usize = 32;

/// Signature data for a single request (API request format)
///
/// All binary data is hex-encoded.
#[derive(Debug, Deserialize, Serialize, ToSchema, Zeroize)]
#[salvo(schema(example = json!({
  "signature": "deadbeef01234567...",
  "tvk": "abcd1234...",
  "tpk": "5678efab...",
  "gammas": [],
  "nested_calls": []
})))]
pub struct SignatureData {
  /// The signature (Aleo Signature type, hex encoded)
  pub signature: String,
  /// The transition view key (Field, hex encoded)
  pub tvk: String,
  /// The transition public key (Group, hex encoded)
  pub tpk: String,
  /// Gamma values for record inputs (Group, hex encoded)
  pub gammas: Vec<String>,
  /// Nested signature data for nested calls
  #[serde(default, skip_serializing_if = "Vec::is_empty")]
  pub nested_calls: Vec<SignatureData>,
}

#[derive(Debug, Deserialize, Serialize, ToSchema, Zeroize)]
pub struct PreparedRequestData {
  /// Whether this is the root request
  pub is_root: bool,
  /// Network ID (0=mainnet, 1=testnet, 2=canary)
  pub network_id: u16,
  /// ProgramID (hex encoded)
  pub program_id: String,
  /// Function name (hex encoded)
  pub function_name: String,
  /// Input values (hex encoded)
  pub inputs: Vec<String>,
  /// Input types (hex encoded)
  pub input_types: Vec<String>,
  /// Nested calls
  #[serde(default, skip_serializing_if = "Vec::is_empty")]
  pub nested_calls: Vec<PreparedRequestData>,
}

/// Request body for creating an authorization from a signed request
#[derive(Debug, Deserialize, Serialize, ToSchema, Zeroize, Extractible)]
#[salvo(schema(example = json!({
  "request": {
    "is_root": true,
    "network_id": 0,
    "program_id": "0763726564697473",
    "function_name": "0f7472616e736665725f7075626c6963",
    "inputs": ["abcd1234..."],
    "input_types": ["0100"],
    "nested_calls": []
  },
  "signatures": ["01012a02010115802c14922e13ae3fa02b3dd403289ded2654770c366397f33f683f8a47c727960310511963ab121b1d65bb1acbbe8fecf83da4d26f0cac471a8010d48f728ba504be32cb6352137ec6c1a5c859671920b6ceefef1926f865e66ad8f28ddcd2dc0530efcd6246287fce5a52ec8fe8ff53b528af9eb8f2d97dd501b780a64a9bd40581bf209a1c60700b55a270b6b90dab16a4c5553dfca58a4091bcb8639979c3ec51421181c020bcf30dd32f4b0e7177ec5020ffe9ce554de82399c089b1fc2b09901003b0071081c10100"],
  "view_key": "AViewKey1...",
  "tlv_version": 1
})),
  extract(default_source(from = "body"))
)]
pub struct CreateAuthorizationRequest {
  /// The prepared request previously returned by the service
  pub request: PreparedRequestData,

  /// TLV-encoded signature blobs, one per request node in DFS pre-order (root first, then nested calls).
  /// Single-call transactions have exactly one entry; multi-call transactions have one entry per call.
  /// A plain string is also accepted for backward compatibility and treated as a single-element array.
  #[serde(deserialize_with = "deserialize_string_or_vec")]
  pub signatures: Vec<String>,

  /// The view key (native format, e.g., "AViewKey1...")
  pub view_key: String,
  /// The TLV version (default 1)
  #[serde(default = "default_tlv_version")]
  pub tlv_version: u8,
}

fn default_tlv_version() -> u8 {
  1
}

fn deserialize_string_or_vec<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
  D: serde::Deserializer<'de>,
{
  #[derive(Deserialize)]
  #[serde(untagged)]
  enum StringOrVec {
    One(String),
    Many(Vec<String>),
  }

  match StringOrVec::deserialize(deserializer)? {
    StringOrVec::One(s) => Ok(vec![s]),
    StringOrVec::Many(v) => Ok(v),
  }
}

/// Response containing the authorization ready for broadcast
#[derive(Debug, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "authorization": "{...}",
  "execution_id": "1234567890abcdef..."
})))]
pub struct AuthorizationResponse {
  /// The authorization object
  pub authorization: Value,
  /// The execution ID of the authorization
  pub execution_id: String,
}

/// Convert API PreparedRequestData to core PreparedRequest
fn parse_prepared_request<N: Network>(
  data: &PreparedRequestData,
) -> AppResult<CorePreparedRequest<N>> {
  let program_id = decode_from_hex(&data.program_id)?;
  let function_name = decode_from_hex(&data.function_name)?;
  let inputs = decode_vec_from_hex(&data.inputs)?;
  let input_types = decode_vec_from_hex(&data.input_types)?;

  let nested_calls = data
    .nested_calls
    .iter()
    .map(parse_prepared_request)
    .collect::<AppResult<Vec<_>>>()?;

  Ok(CorePreparedRequest {
    is_root: data.is_root,
    network_id: data.network_id,
    program_id,
    function_name,
    inputs,
    input_types,
    nested_calls,
    program_checksum: None,
  })
}

fn serialize_authorization<T: Serialize>(authorization: &T) -> AppResult<Value> {
  serde_json::to_value(authorization)
    .map_err(|e| AppError::AuthorizationFailed(format!("Failed to serialize authorization: {}", e)))
}

/// Decode a tree of TLV signature blobs into a RequestSignature tree.
///
/// Consumes one blob per node from `iter` in DFS pre-order (root first, then each
/// nested call subtree recursively). Returns the compute key from the root blob;
/// compute keys in nested blobs are ignored (same signer throughout).
fn decode_signature_tree<'a, N: Network>(
  iter: &mut impl Iterator<Item = &'a String>,
  request: &PreparedRequestData,
  tlv_version: TLVVersion,
) -> AppResult<(RequestSignature<N>, ComputeKey<N>)> {
  decode_signature_tree_recursive(iter, request, tlv_version, 0)
}

fn decode_signature_tree_recursive<'a, N: Network>(
  iter: &mut impl Iterator<Item = &'a String>,
  request: &PreparedRequestData,
  tlv_version: TLVVersion,
  call_deph: usize,
) -> AppResult<(RequestSignature<N>, ComputeKey<N>)> {
  if call_deph >= MAX_NESTED_CALLS {
    // number of signatures is limited to the number of nested calls that we can have
    return Err(AppError::BadRequest(
      "Call depth exceeded when decoding signature tree".to_owned(),
    ));
  }

  let blob = iter.next().ok_or_else(|| {
    AppError::BadRequest(
      "Not enough signatures: expected one TLV blob per request node".to_string(),
    )
  })?;
  let (mut sig, compute_key) = decode_signature::<N>(tlv_version, blob)?;

  for nested in &request.nested_calls {
    let (nested_sig, _) =
      decode_signature_tree_recursive(iter, nested, tlv_version, call_deph + 1)?;
    sig.nested_calls.push(nested_sig);
  }

  Ok((sig, compute_key))
}

#[endpoint(
  operation_id = "create_authorization",
  tags("transactions"),
  summary = "Create an authorization from a signed request",
  description = "Create an authorization from a prepared request and its signatures. The authorization can then be broadcast to the Aleo network.",
  parameters(
    ("network_id" = String, Path, description = "Network identifier (mainnet, testnet, canary)")
  ),
  request_body = CreateAuthorizationRequest,
  status_codes(200, 400, 500),
  responses(
    (status_code = 200, description = "Authorization ready for broadcast", body = AuthorizationResponse),
    (status_code = 400, body = ApiError),
    (status_code = 500, body = ApiError),
  )
)]
pub async fn handle_create_authorization(
  req: &mut Request,
  depot: &mut Depot,
) -> AppResult<Json<AuthorizationResponse>> {
  let network_id_str = req
    .param::<String>("network_id")
    .ok_or_else(|| AppError::BadRequest("Missing network_id parameter".to_string()))?;

  let network = NetworkId::from_str(&network_id_str)?;

  let request: CreateAuthorizationRequest = req
    .extract(depot)
    .await
    .map_err(|e| AppError::BadRequest(e.to_string()))?;

  let span = tracing::Span::current();
  span.set_attribute("network", network.to_string());
  span.set_attribute("program_id", request.request.program_id.clone());

  tracing::info!(
    "Received create authorization request (network={:?}, program_id={:?})",
    network,
    request.request.program_id
  );

  let tlv_version = TLVVersion::try_from(request.tlv_version)?;

  let response = match network {
    NetworkId::Mainnet => {
      let prepared_request = parse_prepared_request::<MainnetV0>(&request.request)?;
      let (signature, compute_key) = decode_signature_tree::<MainnetV0>(
        &mut request.signatures.iter(),
        &request.request,
        tlv_version,
      )?;
      let signed_request = SignedRequest::new(prepared_request, signature);

      let (authorization, execution_id) =
        create_authorization_mainnet(&signed_request, &request.view_key, &compute_key)?;

      AuthorizationResponse {
        authorization: serialize_authorization(&authorization)?,
        execution_id,
      }
    }
    NetworkId::Testnet => {
      let prepared_request = parse_prepared_request::<TestnetV0>(&request.request)?;
      let (signature, compute_key) = decode_signature_tree::<TestnetV0>(
        &mut request.signatures.iter(),
        &request.request,
        tlv_version,
      )?;
      let signed_request = SignedRequest::new(prepared_request, signature);

      let (authorization, execution_id) =
        create_authorization_testnet(&signed_request, &request.view_key, &compute_key)?;

      AuthorizationResponse {
        authorization: serialize_authorization(&authorization)?,
        execution_id,
      }
    }
    NetworkId::Canary => {
      let prepared_request = parse_prepared_request::<CanaryV0>(&request.request)?;
      let (signature, compute_key) = decode_signature_tree::<CanaryV0>(
        &mut request.signatures.iter(),
        &request.request,
        tlv_version,
      )?;
      let signed_request = SignedRequest::new(prepared_request, signature);

      let (authorization, execution_id) =
        create_authorization_canary(&signed_request, &request.view_key, &compute_key)?;

      AuthorizationResponse {
        authorization: serialize_authorization(&authorization)?,
        execution_id,
      }
    }
  };

  Ok(Json(response))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::tlv::TLVVersion;

  fn tlv_v1() -> TLVVersion {
    TLVVersion::try_from(1u8).unwrap()
  }

  fn leaf_request() -> PreparedRequestData {
    PreparedRequestData {
      is_root: true,
      network_id: 1,
      program_id: String::new(),
      function_name: String::new(),
      inputs: vec![],
      input_types: vec![],
      nested_calls: vec![],
    }
  }

  fn is_depth_exceeded_error(err: &AppError) -> bool {
    format!("{err:?}").contains("Call depth exceeded")
  }

  /// depth=16 must fail immediately — before consuming any blob — with the depth guard error.
  #[test]
  fn test_depth_guard_rejects_at_limit() {
    let no_blobs: Vec<String> = vec![];
    let result = decode_signature_tree_recursive::<TestnetV0>(
      &mut no_blobs.iter(),
      &leaf_request(),
      tlv_v1(),
      MAX_NESTED_CALLS,
    );
    assert!(
      result.as_ref().is_err_and(is_depth_exceeded_error),
      "expected depth guard error at depth 16, got: {result:?}"
    );
  }

  /// depth=15 must pass the guard. With an empty iterator it will then fail on "Not enough
  /// signatures", which proves the guard itself did not trigger.
  #[test]
  fn test_depth_guard_allows_below_limit() {
    let no_blobs: Vec<String> = vec![];
    let result = decode_signature_tree_recursive::<TestnetV0>(
      &mut no_blobs.iter(),
      &leaf_request(),
      tlv_v1(),
      MAX_NESTED_CALLS - 10,
    );
    assert!(
      result.as_ref().is_err_and(|e| !is_depth_exceeded_error(e)),
      "depth 15 must not trigger depth guard, got: {result:?}"
    );
  }

  /// The guard must trigger at exactly 16, not one step earlier.
  #[test]
  fn test_depth_guard_boundary_is_exactly_16() {
    let no_blobs: Vec<String> = vec![];

    let at_31 = decode_signature_tree_recursive::<TestnetV0>(
      &mut no_blobs.iter(),
      &leaf_request(),
      tlv_v1(),
      31,
    );
    let at_32 = decode_signature_tree_recursive::<TestnetV0>(
      &mut no_blobs.iter(),
      &leaf_request(),
      tlv_v1(),
      MAX_NESTED_CALLS,
    );

    assert!(
      !at_31.as_ref().is_err_and(is_depth_exceeded_error),
      "depth 31 must not trigger depth guard"
    );
    assert!(
      at_32.as_ref().is_err_and(is_depth_exceeded_error),
      "depth 32 must trigger depth guard"
    );
  }

  /// Any depth >= 16 must be rejected.
  #[test]
  fn test_depth_guard_rejects_beyond_limit() {
    let no_blobs: Vec<String> = vec![];
    let result = decode_signature_tree_recursive::<TestnetV0>(
      &mut no_blobs.iter(),
      &leaf_request(),
      tlv_v1(),
      MAX_NESTED_CALLS + 1,
    );
    assert!(
      result.as_ref().is_err_and(is_depth_exceeded_error),
      "expected depth guard error at depth 33, got: {result:?}"
    );
  }
}
