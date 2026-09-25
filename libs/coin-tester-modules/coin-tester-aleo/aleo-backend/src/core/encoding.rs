//! Hex encoding utilities for snarkVM types
//!
//! Provides serialization helpers for converting snarkVM types to/from
//! hex-encoded strings for API transport.

use crate::AppResult;
use crate::error::AppError;
use snarkvm::prelude::{FromBytes, ToBytes};

/// Encode bytes to hex string (lowercase)
pub fn encode_hex(bytes: &[u8]) -> String {
  hex::encode(bytes)
}

/// Decode hex string to bytes
pub fn decode_hex(s: &str) -> AppResult<Vec<u8>> {
  // Strip optional "0x" prefix
  let s = s.strip_prefix("0x").unwrap_or(s);
  hex::decode(s).map_err(|e| AppError::BadRequest(format!("Invalid hex: {}", e)))
}

/// Encode a snarkVM type to hex using ToBytes
pub fn encode_to_hex<T: ToBytes>(value: &T) -> AppResult<String> {
  let bytes = value
    .to_bytes_le()
    .map_err(|e| AppError::BadRequest(format!("Failed to serialize: {}", e)))?;
  Ok(encode_hex(&bytes))
}

/// Decode a snarkVM type from hex using FromBytes
pub fn decode_from_hex<T: FromBytes>(s: &str) -> AppResult<T> {
  let bytes = decode_hex(s)?;
  T::from_bytes_le(&bytes)
    .map_err(|e| AppError::BadRequest(format!("Failed to deserialize: {}", e)))
}

/// Encode a vector of snarkVM types to hex strings
pub fn encode_vec_to_hex<T: ToBytes>(values: &[T]) -> AppResult<Vec<String>> {
  values.iter().map(encode_to_hex).collect()
}

/// Decode a vector of hex strings to snarkVM types
pub fn decode_vec_from_hex<T: FromBytes>(strings: &[String]) -> AppResult<Vec<T>> {
  strings.iter().map(|s| decode_from_hex(s)).collect()
}
