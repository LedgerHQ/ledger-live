use snarkvm::{
  console::{
    network::Network,
    program::{Ciphertext, Plaintext},
  },
  prelude::{Record, ViewKey},
};

use crate::{AppError, AppResult};
use snarkvm::prelude::{Field, ProgramID};
use snarkvm::prelude::{Group, Identifier, U16, compute_function_id};
use std::str::FromStr;
use tracing::instrument;

pub fn decrypt<N: Network>(
  ciphertext: String,
  view_key: String,
) -> AppResult<Record<N, Plaintext<N>>> {
  let ciphertext_record = Record::<N, Ciphertext<N>>::from_str(&ciphertext)
    .map_err(|_| AppError::InvalidCiphertext("Failed to parse ciphertext record".to_string()))?;

  let view_key = ViewKey::<N>::from_str(&view_key)
    .map_err(|_| AppError::InvalidViewKey("Failed to parse view key".to_string()))?;

  ciphertext_record.decrypt(&view_key).map_err(|_| {
    AppError::InvalidViewKey("Invalid view key for the provided record ciphertext".to_string())
  })
}

#[instrument(
  name = "decrypt_with_transition_info",
  level = "info",
  skip(ciphertext_str, view_key, transition_public_key_str),
  fields(
    program = %program,
    function_name = %function_name,
    index = index
  )
)]
pub fn decrypt_with_transition_info<N: Network>(
  ciphertext_str: &str,
  view_key: &str,
  transition_public_key_str: &str,
  program: &str,
  function_name: &str,
  index: u16,
) -> AppResult<Plaintext<N>> {
  let view_key = ViewKey::<N>::from_str(view_key)?;

  let ciphertext = Ciphertext::<N>::from_str(ciphertext_str)
    .map_err(|e| AppError::InvalidCiphertext(format!("Failed to parse ciphertext: {}", e)))?;

  let program_id =
    ProgramID::from_str(program).map_err(|e| AppError::InvalidTransitionDetails(e.to_string()))?;

  let function_name = Identifier::from_str(function_name)
    .map_err(|e| AppError::InvalidTransitionDetails(e.to_string()))?;

  let function_id = compute_function_id(&U16::<N>::new(N::ID), &program_id, &function_name)
    .map_err(|e| AppError::InvalidTransitionDetails(e.to_string()))?;

  let transition_public_key = Group::from_str(transition_public_key_str)
    .map_err(|e| AppError::InvalidTransitionDetails(e.to_string()))?;

  let tvk: Field<N> = (transition_public_key * *view_key).to_x_coordinate();
  let index = Field::from_u16(index);

  // Compute the input view key and decrypt the ciphertext.
  let input_view_key = N::hash_psd4(&[function_id, tvk, index]).map_err(|_| {
    AppError::InvalidCiphertext(
      "The provided ciphertext decryption parameters are incorrect".to_string(),
    )
  })?;

  ciphertext
    .decrypt_symmetric(input_view_key)
    .map_err(|e| AppError::DecryptionError(format!("Failed to decrypt ciphertext: {}", e)))
}
