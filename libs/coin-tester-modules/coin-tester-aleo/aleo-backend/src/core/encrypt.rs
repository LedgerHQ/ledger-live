use crate::{AppError, AppResult};
use base64::{Engine as _, engine::general_purpose::STANDARD};
use crypto_box::PublicKey;
use crypto_box::aead::OsRng;
use crypto_box::aead::rand_core::CryptoRngCore;
use snarkvm::prelude::{Authorization, Network, ToBytes, ViewKey};
use std::io::{Result as IoResult, Write};
use std::str::FromStr;

// Follows the definition from here
// https://github.com/ProvableHQ/sdk/blob/b4b599cb466912487c83145f0e71791b274a1619/sdk/src/models/provingRequest.ts
struct ProvingRequest<N: Network> {
  pub authorization: Authorization<N>,
  pub fee_authorization: Option<Authorization<N>>,
  pub broadcast: bool,
}

/// Based on the Aleo SDK
/// wasm/src/types/native/request/bytes.rs
impl<N: Network> ToBytes for ProvingRequest<N> {
  fn write_le<W: Write>(&self, mut writer: W) -> IoResult<()> {
    self.authorization.write_le(&mut writer)?;

    match &self.fee_authorization {
      Some(fee) => {
        true.write_le(&mut writer)?;
        fee.write_le(&mut writer)?;
      }
      None => {
        false.write_le(&mut writer)?;
      }
    }

    self.broadcast.write_le(&mut writer)?;
    Ok(())
  }
}

pub fn encrypt_registration_request<N: Network>(
  public_key: &str,
  view_key: &str,
  start: u32,
) -> AppResult<String> {
  let mut rng = OsRng;
  encrypt_registration_request_with_rng::<N, _>(public_key, view_key, start, &mut rng)
}

fn encrypt_registration_request_with_rng<N: Network, R: CryptoRngCore>(
  public_key: &str,
  view_key: &str,
  start: u32,
  rng: &mut R,
) -> AppResult<String> {
  let view_key = ViewKey::<N>::from_str(view_key)
    .map_err(|_| AppError::InvalidViewKey("Failed to parse view key".to_string()))?;
  let view_key_bytes = view_key
    .to_bytes_le()
    .map_err(|e| AppError::InvalidViewKey(format!("Failed to encode view key: {}", e)))?;

  // Implementation logic based on the Provable SDK https://github.com/ProvableHQ/sdk/blob/c1fc21a795bf6716ef4d214ec55ea0f35237fb16/sdk/src/security.ts#L51
  let mut message = Vec::with_capacity(view_key_bytes.len() + size_of::<u32>());
  message.extend_from_slice(&view_key_bytes);
  message.extend_from_slice(&start.to_le_bytes());

  let public_key_bytes = STANDARD
    .decode(public_key)
    .map_err(|e| AppError::BadRequest(format!("Invalid public key base64: {}", e)))?;
  let public_key = PublicKey::from_slice(&public_key_bytes)
    .map_err(|_| AppError::BadRequest("Invalid public key length".to_string()))?;

  let encrypted = public_key
    .seal(rng, &message)
    .map_err(|e| AppError::InternalServerError(anyhow::anyhow!("Encryption failed: {}", e)))?;

  Ok(STANDARD.encode(encrypted))
}

pub fn encrypt_proving_request<N: Network>(
  public_key: &str,
  authorization_value: serde_json::Value,
  fee_authorization_value: serde_json::Value,
  broadcast: bool,
) -> AppResult<String> {
  let mut rng = OsRng;

  let authorization: Authorization<N> = serde_json::from_value(authorization_value)
    .map_err(|e| AppError::BadRequest(format!("Invalid authorization object: {}", e)))?;

  let fee_authorization: Option<Authorization<N>> = if fee_authorization_value.is_null() {
    None
  } else {
    Some(
      serde_json::from_value(fee_authorization_value)
        .map_err(|e| AppError::BadRequest(format!("Invalid fee authorization object: {}", e)))?,
    )
  };

  encrypt_proving_request_core::<N>(
    public_key,
    authorization,
    fee_authorization,
    broadcast,
    &mut rng,
  )
}

pub fn encrypt_proving_request_core<N: Network>(
  public_key: &str,
  authorization: Authorization<N>,
  fee_authorization: Option<Authorization<N>>,
  broadcast: bool,
  rng: &mut OsRng,
) -> AppResult<String> {
  let proving_request = ProvingRequest {
    authorization,
    fee_authorization,
    broadcast,
  };

  let message = proving_request.to_bytes_le().map_err(|e| {
    AppError::InternalServerError(anyhow::anyhow!("Failed to encode proving request: {}", e))
  })?;

  let public_key_bytes = STANDARD
    .decode(public_key)
    .map_err(|e| AppError::BadRequest(format!("Invalid public key base64: {}", e)))?;

  let public_key = PublicKey::from_slice(&public_key_bytes)
    .map_err(|_| AppError::BadRequest("Invalid public key length".to_string()))?;

  let encrypted = public_key
    .seal(rng, &message)
    .map_err(|e| AppError::InternalServerError(anyhow::anyhow!("Encryption failed: {}", e)))?;

  Ok(STANDARD.encode(encrypted))
}
