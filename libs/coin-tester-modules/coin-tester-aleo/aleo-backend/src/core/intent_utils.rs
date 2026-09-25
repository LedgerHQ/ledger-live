use crate::{AppError, AppResult};
use anyhow::Result;
use snarkvm::prelude::{
  Field, FromBits, Group, Identifier, Network, Plaintext, Program, ProgramID, Record, ViewKey,
};
use std::str::FromStr;

pub fn compute_record_commitment<N: Network>(
  record: &Record<N, Plaintext<N>>,
  record_name: &Identifier<N>,
  program_id: &ProgramID<N>,
  view_key: &ViewKey<N>,
) -> Result<(Field<N>, Field<N>)> {
  let record_view_key = (*record.nonce() * **view_key).to_x_coordinate();
  let commitment = record.to_commitment(program_id, record_name, &record_view_key)?;
  Ok((commitment, record_view_key))
}

pub fn compute_h_generator<N: Network>(commitment: &Field<N>) -> Result<Group<N>> {
  N::hash_to_group_psd2(&[N::serial_number_domain(), *commitment])
}

/// Compute the program checksum field for a given program source string.
///
/// Replicates `Stack::program_checksum_as_field`: Keccak-256 of the program source,
/// converted to a field element (little-endian bits, truncated to field data size).
/// Required for programs that declare a `constructor`, so the hardware wallet includes
/// the checksum in its signed message and snarkVM's `request.verify` passes.
pub fn compute_program_checksum<N: Network>(program_src: &str) -> AppResult<Field<N>> {
  let program = Program::<N>::from_str(program_src)
    .map_err(|e| AppError::BadRequest(format!("Failed to parse program: {e}")))?;
  let checksum = program.to_checksum();
  let bits: Vec<bool> = checksum
    .iter()
    .flat_map(|byte| {
      let b: u8 = **byte;
      (0..8u8).map(move |i| (b >> i) & 1 == 1)
    })
    .take(Field::<N>::SIZE_IN_DATA_BITS)
    .collect();
  Field::<N>::from_bits_le(&bits).map_err(|e| {
    AppError::BadRequest(format!(
      "Checksum field conversion: {e} for program {}",
      program
    ))
  })
}
