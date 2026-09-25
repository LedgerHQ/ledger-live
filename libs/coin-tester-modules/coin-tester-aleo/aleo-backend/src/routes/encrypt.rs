use super::intent::NetworkId;
use crate::core::{encrypt_proving_request, encrypt_registration_request};
use crate::{ApiError, AppError, AppResult};
use salvo::oapi::ToSchema;
use salvo::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use snarkvm::prelude::{CanaryV0, MainnetV0, Network, TestnetV0};
use std::str::FromStr;
use tracing_opentelemetry::OpenTelemetrySpanExt;
use zeroize::Zeroize;

#[derive(Debug, Deserialize, Serialize, Extractible, ToSchema, Zeroize)]
#[salvo(
  schema(example = json!({
    "public_key": "OK1CoegLJbHlDjYxKch+TsluOogL7elc4ygSSTqJ3Qc=",
    "view_key": "AViewKey1tTb4WYnMFnDWjSgTSA5VkiyLKNZH1szDcMyEuzSu1zbk",
    "start": 2
  })),
  extract(default_source(from = "body"))
)]
pub struct EncryptRegistrationRequest {
  /// The cryptobox X25519 public key to encrypt with (base64).
  pub public_key: String,
  /// The Aleo view key to encode in the registration request.
  pub view_key: String,
  /// The starting height (LE u32).
  pub start: u32,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct EncryptRegistrationResponse {
  pub encrypted: String,
}

#[endpoint(
  operation_id = "encrypt_registration_request",
  tags("encrypt"),
  summary = "Encrypt a registration request",
  description = "Encrypt a view key and start height for a registration request",
  parameters(
    ("network_id" = String, Path, description = "Network identifier (mainnet, testnet, canary)")
  ),
  request_body = EncryptRegistrationRequest,
  status_codes(200, 400, 500),
  responses(
    (status_code = 200, description = "Encrypted registration request", body = EncryptRegistrationResponse),
    (status_code = 400, body = ApiError),
    (status_code = 500, body = ApiError),
  )
)]
pub async fn handle_encrypt_registration(
  req: &mut Request,
  depot: &mut Depot,
) -> AppResult<Json<EncryptRegistrationResponse>> {
  let network_id_str = req
    .param::<String>("network_id")
    .ok_or_else(|| AppError::BadRequest("Missing network_id".to_string()))?;
  let network_id = NetworkId::from_str(&network_id_str)?;
  let body: EncryptRegistrationRequest = req
    .extract(depot)
    .await
    .map_err(|e| AppError::BadRequest(e.to_string()))?;

  tracing::Span::current().set_attribute("network", network_id.to_string());

  let encrypted = match network_id {
    NetworkId::Mainnet => encrypt_with_network::<MainnetV0>(&body)?,
    NetworkId::Testnet => encrypt_with_network::<TestnetV0>(&body)?,
    NetworkId::Canary => encrypt_with_network::<CanaryV0>(&body)?,
  };

  Ok(Json(EncryptRegistrationResponse { encrypted }))
}

fn encrypt_with_network<N: Network>(data: &EncryptRegistrationRequest) -> AppResult<String> {
  encrypt_registration_request::<N>(&data.public_key, &data.view_key, data.start)
}

#[derive(Debug, Deserialize, Serialize, Extractible, ToSchema)]
#[salvo(
  schema(example = json!({
    "public_key": "OK1CoegLJbHlDjYxKch+TsluOogL7elc4ygSSTqJ3Qc=",
    "proving_request": {
      "authorization": "{}",
      "fee_authorization": "{}",
      "broadcast": true,
    }
  })),
  extract(default_source(from = "body"))
)]
pub struct EncryptProvingRequest {
  /// The cryptobox X25519 public key to encrypt with (base64).
  pub public_key: String,
  /// The authorization object used for delegated proving
  pub proving_request: ProvingRequestData,
}

#[derive(Debug, Deserialize, Serialize, ToSchema, Extractible)]
pub struct ProvingRequestData {
  pub authorization: Value,
  pub fee_authorization: Value,
  pub broadcast: bool,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct EncryptProvingResponse {
  pub encrypted: String,
}

#[endpoint(
  operation_id = "encrypt_proving_request",
  tags("encrypt"),
  summary = "Encrypt a proving request",
  description = "Encrypt an authorization object for a proving request",
  parameters(
    ("network_id" = String, Path, description = "Network identifier (mainnet, testnet, canary)")
  ),
  request_body = EncryptProvingRequest,
  status_codes(200, 400, 500),
  responses(
    (status_code = 200, description = "Encrypted proving request", body = EncryptProvingResponse),
    (status_code = 400, body = ApiError),
    (status_code = 500, body = ApiError),
  )
)]
pub async fn handle_encrypt_proving(
  req: &mut Request,
  depot: &mut Depot,
) -> AppResult<Json<EncryptProvingResponse>> {
  let network_id_str = req
    .param::<String>("network_id")
    .ok_or_else(|| AppError::BadRequest("Missing network_id".to_string()))?;
  let network_id = NetworkId::from_str(&network_id_str)?;
  let body: EncryptProvingRequest = req
    .extract(depot)
    .await
    .map_err(|e| AppError::BadRequest(e.to_string()))?;

  tracing::Span::current().set_attribute("network", network_id.to_string());

  let encrypted = match network_id {
    NetworkId::Mainnet => encrypt_proving_with_network::<MainnetV0>(body)?,
    NetworkId::Testnet => encrypt_proving_with_network::<TestnetV0>(body)?,
    NetworkId::Canary => encrypt_proving_with_network::<CanaryV0>(body)?,
  };

  Ok(Json(EncryptProvingResponse { encrypted }))
}

fn encrypt_proving_with_network<N: Network>(data: EncryptProvingRequest) -> AppResult<String> {
  encrypt_proving_request::<N>(
    &data.public_key,
    data.proving_request.authorization,
    data.proving_request.fee_authorization,
    data.proving_request.broadcast,
  )
}
