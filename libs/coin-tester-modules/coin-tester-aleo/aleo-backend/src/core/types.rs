//! Internal types for transaction request handling
//!
//! These types mirror the structures from the aleo-hw-signer-poc for
//! creating and authorizing Aleo transactions.

use snarkvm::console::network::Network;
use snarkvm::console::program::{Identifier, ProgramID, Value, ValueType};
use snarkvm::console::types::Field;
use snarkvm::prelude::{Group, Signature};

/// Data needed to sign an Aleo transaction, built from a user intent for a hardware wallet.
#[derive(Debug, Clone)]
pub struct PreparedRequest<N: Network> {
  /// Whether this is the root request (true) or a nested call (false)
  pub is_root: bool,
  /// Network identifier (MainnetV0::ID, TestnetV0::ID, etc.)
  pub network_id: u16,
  /// The program ID (e.g., "credits.aleo")
  pub program_id: ProgramID<N>,
  /// The function name (e.g., "transfer_public")
  pub function_name: Identifier<N>,
  /// The input values for the function call
  pub inputs: Vec<Value<N>>,
  /// The types of each input
  pub input_types: Vec<ValueType<N>>,
  /// Nested function calls (for complex transactions)
  pub nested_calls: Vec<PreparedRequest<N>>,
  /// Program checksum field for programs that declare a `constructor`.
  /// Included in the signing message so the hardware wallet can verify it is
  /// signing for the expected program binary.
  pub program_checksum: Option<Field<N>>,
}

impl<N: Network> PreparedRequest<N> {
  /// Create a new root prepared request
  pub fn new(
    network_id: u16,
    program_id: ProgramID<N>,
    function_name: Identifier<N>,
    inputs: Vec<Value<N>>,
    input_types: Vec<ValueType<N>>,
  ) -> Self {
    Self {
      is_root: true,
      network_id,
      program_id,
      function_name,
      inputs,
      input_types,
      nested_calls: Vec::new(),
      program_checksum: None,
    }
  }

  /// Create a nested (non-root) prepared request
  pub fn new_nested(
    network_id: u16,
    program_id: ProgramID<N>,
    function_name: Identifier<N>,
    inputs: Vec<Value<N>>,
    input_types: Vec<ValueType<N>>,
  ) -> Self {
    Self {
      is_root: false,
      network_id,
      program_id,
      function_name,
      inputs,
      input_types,
      nested_calls: Vec::new(),
      program_checksum: None,
    }
  }

  /// Add a nested call to this request
  pub fn with_nested_call(mut self, nested: PreparedRequest<N>) -> Self {
    self.nested_calls.push(nested);
    self
  }

  /// Set the program checksum (used for programs with a `constructor`).
  pub fn with_program_checksum(mut self, cs: Field<N>) -> Self {
    self.program_checksum = Some(cs);
    self
  }
}

/// Cryptographic data produced by signing a `PreparedRequest`, needed for authorization.
#[derive(Debug, Clone)]
pub struct RequestSignature<N: Network> {
  /// The Aleo signature over the request
  pub signature: Signature<N>,
  /// Transition view key (tvk)
  pub tvk: Field<N>,
  /// Transition public key (tpk)
  pub tpk: Group<N>,
  /// Gamma values for record inputs (one per record input)
  pub gammas: Vec<Group<N>>,
  /// Signatures for nested calls
  pub nested_calls: Vec<RequestSignature<N>>,
}

/// A prepared request combined with its signature data, ready for authorization.
#[derive(Debug, Clone)]
pub struct SignedRequest<N: Network> {
  /// The original prepared request
  pub source: PreparedRequest<N>,
  /// The signature data
  pub signature: RequestSignature<N>,
}

impl<N: Network> SignedRequest<N> {
  /// Create a new signed request
  pub fn new(source: PreparedRequest<N>, signature: RequestSignature<N>) -> Self {
    Self { source, signature }
  }
}
