use std::{fmt::Display, ops::Deref, str::FromStr};

use super::intent::{NetworkId, RecordContent};
use crate::core::decrypt::decrypt_with_transition_info;
use crate::{ApiError, AppError, AppResult, core::decrypt};
use salvo::oapi::ToSchema;
use salvo::prelude::*;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use snarkvm::prelude::{CanaryV0, Entry, MainnetV0, Network, Owner, Record, TestnetV0, Visibility};
use tracing::info;
use tracing_opentelemetry::OpenTelemetrySpanExt;
use zeroize::Zeroize;

#[derive(Debug, Deserialize, Serialize, Extractible, ToSchema, Zeroize)]
#[salvo(
    schema(example = json!({
      "ciphertext": "record1qyqsqv3m3gqcpduq27arhu4avcclhnexlvry5gq8f2dw3v8hene24rcgqgqkzscqqgpqp3as33gu7sek5a257kmmp3v2cgd9da2jt4m5wchpd233hq0wu2s34y3sd6y7jv0nx4uuh67urh3ft2rma3djueyefshav7tf5h6zdgxszcjrqqpqyqrujqm06tklz0f9thljkwhe0hhhdsczwmqld0erydscxh9jxypcpyrfvwq5gtan9hhgvmkvrmp66x77pyr2mpmmxv3pqjvflpv42dzqf5ukxlkwe90lr9tq6qj5vcc46t36hcjvp7tss2r6jvp6pe0jgxg2rdegdh",
      "view_key": "AViewKey1pVcpDyCJBfhFi5tm9NxdfDojmUt2qwtGc5avX2JRTKcW"
    })),
    extract(default_source(from = "body"))
)]
pub struct DecryptRequest {
  /// The record ciphertext to decrypt.
  pub ciphertext: String,
  /// The view key used to decrypt the record ciphertext.
  pub view_key: String,
}

pub type DecryptResponse = RecordContent;

impl<N: Network, Private: Visibility> From<Record<N, Private>> for DecryptResponse
where
  Owner<N, Private>: Display,
  Entry<N, Private>: Display,
{
  fn from(record: Record<N, Private>) -> Self {
    DecryptResponse {
      owner: record.owner().to_string(),
      data: record
        .data()
        .iter()
        .map(|(key, value)| (key.to_string(), value.to_string()))
        .collect(),
      nonce: record.nonce().to_string(),
      version: record.version().deref().to_owned(),
    }
  }
}

async fn parse_body_and_network_id<REQUEST>(req: &mut Request) -> AppResult<(REQUEST, NetworkId)>
where
  REQUEST: DeserializeOwned,
{
  let network_id_str = req
    .param::<String>("network_id")
    .ok_or_else(|| AppError::BadRequest("Missing network_id".to_string()))?;

  let network_id = NetworkId::from_str(&network_id_str)?;

  let body: REQUEST = req
    .parse_json()
    .await
    .map_err(|e| AppError::BadRequest(e.to_string()))?;
  Ok((body, network_id))
}

#[endpoint(
    operation_id = "decrypt",
    tags("decrypt"),
    summary = "Decrypt a record",
    description = "Decrypt a record",
    parameters(
      ("network_id" = String, Path, description = "Network identifier (mainnet, testnet, canary)")
    ),
    request_body = DecryptRequest,
    status_codes(200, 400, 500),
    responses(
      (status_code = 200, description = "Plain text record", body = DecryptResponse),
      (status_code = 400, body = ApiError),
      (status_code = 500, body = ApiError),
    )
  )]
pub async fn handle_decrypt(req: &mut Request) -> AppResult<Json<DecryptResponse>> {
  let (body, network_id) = parse_body_and_network_id::<DecryptRequest>(req).await?;

  tracing::Span::current().set_attribute("network", network_id.to_string());

  info!(
    "Received decrypt request (network={:?}, ciphertext={:?}, view_key=[redacted])",
    network_id, body.ciphertext
  );

  let response: DecryptResponse = match network_id {
    NetworkId::Mainnet => decrypt::<MainnetV0>(body.ciphertext, body.view_key)?.into(),
    NetworkId::Testnet => decrypt::<TestnetV0>(body.ciphertext, body.view_key)?.into(),
    NetworkId::Canary => decrypt::<CanaryV0>(body.ciphertext, body.view_key)?.into(),
  };

  Ok(Json(response))
}

/// Request to decrypt a ciphertext
#[derive(Debug, Deserialize, Serialize, ToSchema, Zeroize)]
#[salvo(schema(example = json!({
  "index": 0,
  "ciphertext": "ciphertext1qgqzc6p6n4wak0je6ug3sxyrapw6gsuah224chfu58j5fxfs83vdwpwjmm0kf3srtcjs3ef620egm5qcjg8lpuuk2xndxpnudpp0s5fqqvxda4vr",
  "transition_public_key": "4186978281454801708460980102943644011279890163781400586692467118685934385659group",
  "view_key": "...",
  "program": "credits.aleo",
  "function_name": "transfer_public_to_private"
})))]
pub struct SymmetricDecryptRequest {
  pub ciphertext: String,
  pub transition_public_key: String,
  pub view_key: String,
  pub program: String,
  pub function_name: String,
  pub index: u16,
}

/// Response containing the decrypted plaintext
#[derive(Debug, Serialize, ToSchema)]
pub struct SymmetricDecryptResponse {
  pub plaintext: String,
}

#[endpoint(
  operation_id = "symmetric_decrypt",
  tags("decrypt"),
  summary = "Decrypt a ciphertext",
  description = "Decrypt a ciphertext using the transition public key, view key, and program information",
  parameters(
    ("network_id" = String, Path, description = "Network identifier (mainnet, testnet, canary)")
  ),
  request_body = SymmetricDecryptRequest,
  status_codes(200, 400, 500),
  responses(
    (status_code = 200, description = "Decrypted plaintext", body = SymmetricDecryptResponse),
    (status_code = 400, body = ApiError),
    (status_code = 500, body = ApiError),
  )
)]
pub async fn handle_symmetric_decrypt(
  req: &mut Request,
) -> AppResult<Json<SymmetricDecryptResponse>> {
  let (body, network_id) = parse_body_and_network_id::<SymmetricDecryptRequest>(req).await?;

  let span = tracing::Span::current();
  span.set_attribute("network", network_id.to_string());
  span.set_attribute("program", body.program.clone());
  span.set_attribute("function_name", body.function_name.clone());

  let plaintext = match network_id {
    NetworkId::Mainnet => decrypt_with_network::<MainnetV0>(&body)?,
    NetworkId::Testnet => decrypt_with_network::<TestnetV0>(&body)?,
    NetworkId::Canary => decrypt_with_network::<CanaryV0>(&body)?,
  };

  Ok(Json(SymmetricDecryptResponse { plaintext }))
}

fn decrypt_with_network<N: Network>(data: &SymmetricDecryptRequest) -> AppResult<String> {
  info!(
    "Decrypting ciphertext with nonce(transition public key) {}",
    data.transition_public_key
  );

  decrypt_with_transition_info::<N>(
    &data.ciphertext,
    &data.view_key,
    &data.transition_public_key,
    &data.program,
    &data.function_name,
    data.index,
  )
  .map(|plaintext_result| plaintext_result.to_string())
}
