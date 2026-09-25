use std::collections::VecDeque;

use anyhow::{anyhow, bail, ensure};
use snarkvm::circuit::Aleo;
use snarkvm::console::network::Network;
use snarkvm::console::program::{Literal, ProgramID};
use snarkvm::console::types::Field;
use snarkvm::prelude::{
  Authorization, CryptoRng, Plaintext, Request, Response, Rng, Transition, Value, ValueType,
};
use snarkvm::synthesizer::process::{CallStack, Registers, Stack};
use snarkvm::synthesizer::program::{
  Call, CallOperator, Instruction, Operand, RegistersSigner, RegistersTrait, StackTrait,
};

pub(super) struct PreloadedCallStack<N: Network> {
  /// DFS-ordered pre-assembled (request, input_types) pairs: root at front, leaf sub-calls at
  /// back. Each call to custom_evaluate_function pops one entry from the front.
  /// The `Vec<ValueType<N>>` holds the types the signer used when signing — these may differ
  /// from the function definition types (e.g. Record vs ExternalRecord for ldgbatcher inputs).
  pub entries: VecDeque<(Request<N>, Vec<ValueType<N>>)>,
  pub authorization: Authorization<N>,
}

/// Adapted from `Stack::evaluate_function` in snarkvm-synthesizer-process.
///
/// Instead of popping from a LIFO `CallStack::Authorize`, this function pops
/// from the front of a `VecDeque` (FIFO), so requests are consumed in the
/// same DFS order they were assembled.
pub(super) fn custom_evaluate_function<N, A, R>(
  stack: &Stack<N>,
  pcs: &mut PreloadedCallStack<N>,
  caller: Option<ProgramID<N>>,
  root_tvk: Option<Field<N>>,
  rng: &mut R,
) -> anyhow::Result<Response<N>>
where
  N: Network,
  A: Aleo<Network = N>,
  R: Rng + CryptoRng,
{
  let (request, verify_types) = pcs
    .entries
    .pop_front()
    .ok_or_else(|| anyhow!("PreloadedCallStack is empty"))?;

  ensure!(
    **request.network_id() == N::ID,
    "Network ID mismatch. Expected {}, but found {}",
    N::ID,
    request.network_id()
  );

  let function = stack.get_function(request.function_name())?;
  let inputs = request.inputs();
  let signer = *request.signer();
  let (is_root, caller) = match caller {
    Some(caller) => (false, caller.to_address()?),
    None => (true, signer),
  };
  let tvk = *request.tvk();

  if function.inputs().len() != inputs.len() {
    bail!(
      "Function '{}' in the program '{}' expects {} inputs, but {} were provided.",
      function.name(),
      stack.program_id(),
      function.inputs().len(),
      inputs.len()
    )
  }

  let placeholder_call_stack = CallStack::Authorize(vec![], None, pcs.authorization.clone());
  let mut registers = Registers::<N, A>::new(
    placeholder_call_stack,
    stack.get_register_types(function.name())?.clone(),
  );
  registers.set_signer(signer);
  registers.set_caller(caller);
  registers.set_tvk(tvk);
  if let Some(root_tvk) = root_tvk {
    registers.set_root_tvk(root_tvk);
  } else {
    registers.set_root_tvk(tvk);
  }

  let program_checksum = match stack.program().contains_constructor() {
    true => Some(stack.program_checksum_as_field()?),
    false => None,
  };

  ensure!(
    request.verify(&verify_types, is_root, program_checksum),
    "[Evaluate] Request is invalid"
  );

  function
    .inputs()
    .iter()
    .map(|i| i.register())
    .zip(inputs)
    .try_for_each(|(register, input)| registers.store(stack, register, input.clone()))?;

  for instruction in function.instructions() {
    let result = match instruction {
      Instruction::Call(call) => {
        custom_call_evaluate::<N, A, R>(call, stack, pcs, &mut registers, rng)
      }
      _ => instruction.evaluate(stack, &mut registers),
    };
    if let Err(error) = result {
      bail!("Failed to evaluate instruction ({instruction}): {error}");
    }
  }

  let output_operands = &function
    .outputs()
    .iter()
    .map(|output| output.operand())
    .collect::<Vec<_>>();

  let outputs = output_operands
    .iter()
    .map(|operand| match operand {
      Operand::Literal(literal) => Ok(Value::Plaintext(Plaintext::from(literal))),
      Operand::Register(register) => registers.load(stack, &Operand::Register(register.clone())),
      Operand::ProgramID(program_id) => Ok(Value::Plaintext(Plaintext::from(Literal::Address(
        program_id.to_address()?,
      )))),
      Operand::Signer => Ok(Value::Plaintext(Plaintext::from(Literal::Address(
        registers.signer()?,
      )))),
      Operand::Caller => Ok(Value::Plaintext(Plaintext::from(Literal::Address(
        registers.caller()?,
      )))),
      Operand::BlockHeight => bail!("Cannot retrieve the block height from a function scope."),
      Operand::BlockTimestamp => {
        bail!("Cannot retrieve the block timestamp from a function scope.")
      }
      Operand::NetworkID => bail!("Cannot retrieve the network ID from a function scope."),
      Operand::Checksum(_) => {
        bail!("Cannot retrieve the program checksum from a function scope.")
      }
      Operand::Edition(_) => bail!("Cannot retrieve the edition from a function scope."),
      Operand::ProgramOwner(_) => {
        bail!("Cannot retrieve the program owner from a function scope.")
      }
    })
    .collect::<anyhow::Result<Vec<_>>>()?;

  let output_registers = output_operands
    .iter()
    .map(|operand| match operand {
      Operand::Register(register) => Some(register.clone()),
      _ => None,
    })
    .collect::<Vec<_>>();

  let response = Response::new(
    request.signer(),
    request.network_id(),
    stack.program_id(),
    function.name(),
    request.inputs().len(),
    request.tvk(),
    request.tcm(),
    outputs,
    &function.output_types(),
    &output_registers,
  )?;

  let transition = Transition::from(
    &request,
    &response,
    &function.output_types(),
    &output_registers,
  )?;

  pcs.authorization.insert_transition(transition)?;

  Ok(response)
}

/// Adapted from the function branch of `Call::evaluate` in snarkvm-synthesizer-process.
///
/// For nested function calls, instead of signing a new request with a private key,
/// we peek the next pre-assembled request from `pcs` and delegate to
/// `custom_evaluate_function`. We do NOT call `pcs.authorization.push` here
/// because `assemble_nested_requests` already populated `authorization.requests`.
fn custom_call_evaluate<N, A, R>(
  call: &Call<N>,
  stack: &Stack<N>,
  pcs: &mut PreloadedCallStack<N>,
  registers: &mut Registers<N, A>,
  rng: &mut R,
) -> anyhow::Result<()>
where
  N: Network,
  A: Aleo<Network = N>,
  R: Rng + CryptoRng,
{
  let inputs: Vec<_> = call
    .operands()
    .iter()
    .map(|operand| registers.load(stack, operand))
    .collect::<anyhow::Result<Vec<_>>>()?;

  let (external_stack, resource) = match call.operator() {
    CallOperator::Locator(locator) => (
      Some(stack.get_external_stack(locator.program_id())?),
      locator.resource(),
    ),
    CallOperator::Resource(resource) => {
      if stack.program().contains_function(resource) {
        bail!("Cannot call '{resource}'. Use a closure ('closure {resource}:') instead.")
      }
      (None, resource)
    }
  };

  let substack = match &external_stack {
    Some(external_stack) => external_stack.as_ref(),
    None => stack,
  };

  let outputs = if let Ok(closure) = substack.program().get_closure(resource) {
    if closure.inputs().len() != inputs.len() {
      bail!(
        "Expected {} inputs, found {}",
        closure.inputs().len(),
        inputs.len()
      )
    }
    substack.evaluate_closure::<A>(
      &closure,
      &inputs,
      registers.call_stack(),
      registers.signer()?,
      registers.caller()?,
      registers.tvk()?,
    )?
  } else if let Ok(function) = substack.program().get_function(resource) {
    if function.inputs().len() != inputs.len() {
      bail!(
        "Expected {} inputs, found {}",
        function.inputs().len(),
        inputs.len()
      )
    }

    // Peek at the next pre-assembled request; it will be popped by custom_evaluate_function.
    {
      let (req, _) = pcs.entries.front().ok_or_else(|| {
        anyhow!(
          "No pre-assembled request for nested call '{}/{}'",
          substack.program_id(),
          function.name(),
        )
      })?;

      ensure!(
        req.program_id() == substack.program_id(),
        "Mismatched program ID for nested call: expected '{}', found '{}'",
        substack.program_id(),
        req.program_id(),
      );
      ensure!(
        req.function_name() == function.name(),
        "Mismatched function name for nested call: expected '{}', found '{}'",
        function.name(),
        req.function_name(),
      );
    }

    // assemble_nested_requests already pushed all nested requests to authorization.requests;
    // calling push again would create duplicates since Authorization::push has no dup check.

    let root_tvk = Some(registers.root_tvk()?);
    let console_caller = Some(*stack.program_id());
    let response =
      custom_evaluate_function::<N, A, R>(substack, pcs, console_caller, root_tvk, rng)?;
    response.outputs().to_vec()
  } else {
    bail!(
      "Call operator '{}' is invalid or unsupported.",
      call.operator()
    )
  };

  for (output, register) in outputs.into_iter().zip(call.destinations()) {
    registers.store(stack, &register, output)?;
  }

  Ok(())
}
