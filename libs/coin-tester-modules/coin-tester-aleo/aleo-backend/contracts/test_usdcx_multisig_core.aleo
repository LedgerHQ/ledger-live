program test_usdcx_multisig_core.aleo;

struct ProgramSettings:
    allow_upgrades as boolean;
    upgrader_address as address;
    guard_create_wallet as boolean;

struct GuardedCreateWalletOp:
    wallet_id as address;
    threshold as u8;
    aleo_signers as [address; 4u32];
    ecdsa_signers as [[u8; 20u32]; 4u32];

struct WalletAleoSigner:
    wallet_id as address;
    aleo_signer as address;

struct WalletEcdsaSigner:
    wallet_id as address;
    ecdsa_signer as [u8; 20u32];

struct WalletSettings:
    threshold as u8;
    num_signers as u8;

struct WalletSigningOpId:
    wallet_id as address;
    signing_op_id as field;

struct WalletSigningOpIdNonce:
    wallet_id as address;
    signing_op_id as field;
    nonce as u64;

struct WalletSigningOp:
    confirmations as u8;
    initiated_at_block as u32;
    expires_at_block as u32;
    round as u32;

struct SigningOpConfirmation:
    wallet_signing_op_id_hash as field;
    wallet_signer_hash as field;

struct AdminOp:
    op as u8;
    threshold as u8;
    aleo_signer as address;
    ecdsa_signer as [u8; 20u32];

mapping program_settings_map:
    key as boolean.public;
    value as ProgramSettings.public;

mapping signers_map:
    key as field.public;
    value as boolean.public;

mapping wallets_map:
    key as address.public;
    value as WalletSettings.public;

mapping pending_signing_ops:
    key as field.public;
    value as WalletSigningOp.public;

mapping pending_signing_confirmations:
    key as field.public;
    value as u32.public;

mapping completed_signing_ops:
    key as field.public;
    value as u32.public;

mapping used_nonces:
    key as field.public;
    value as boolean.public;

mapping pending_admin_ops:
    key as field.public;
    value as AdminOp.public;

function init:
    input r0 as address.private;
    input r1 as boolean.private;
    async init self.caller r0 r1 into r2;
    output r2 as test_usdcx_multisig_core.aleo/init.future;

finalize init:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as boolean.public;
    assert.eq r0 aleo1cytp7hvkrcw7x2myhzh9qgyhfaelpgcykp5yppjr7zdzekqz5qrs2dd7h6;
    contains program_settings_map[true] into r3;
    not r3 into r4;
    assert.eq r4 true;
    cast true r1 r2 into r5 as ProgramSettings;
    set r5 into program_settings_map[true];

function disallow_upgrades:
    async disallow_upgrades self.caller into r0;
    output r0 as test_usdcx_multisig_core.aleo/disallow_upgrades.future;

finalize disallow_upgrades:
    input r0 as address.public;
    contains program_settings_map[true] into r1;
    assert.eq r1 true;
    get program_settings_map[true] into r2;
    assert.eq r0 r2.upgrader_address;
    cast false r2.upgrader_address r2.guard_create_wallet into r3 as ProgramSettings;
    set r3 into program_settings_map[true];

function set_upgrader_address:
    input r0 as address.private;
    async set_upgrader_address self.caller r0 into r1;
    output r1 as test_usdcx_multisig_core.aleo/set_upgrader_address.future;

finalize set_upgrader_address:
    input r0 as address.public;
    input r1 as address.public;
    contains program_settings_map[true] into r2;
    assert.eq r2 true;
    get program_settings_map[true] into r3;
    assert.eq r0 r3.upgrader_address;
    assert.eq r3.allow_upgrades true;
    cast r3.allow_upgrades r1 r3.guard_create_wallet into r4 as ProgramSettings;
    set r4 into program_settings_map[true];

function create_wallet:
    input r0 as address.public;
    input r1 as u8.public;
    input r2 as [address; 4u32].private;
    input r3 as [[u8; 20u32]; 4u32].private;
    gt r1 0u8 into r4;
    lte r1 8u8 into r5;
    and r4 r5 into r6;
    assert.eq r6 true;
    cast r0 r2[0u32] into r7 as WalletAleoSigner;
    hash.bhp256 r7 into r8 as field;
    cast r0 r2[1u32] into r9 as WalletAleoSigner;
    hash.bhp256 r9 into r10 as field;
    cast r0 r2[2u32] into r11 as WalletAleoSigner;
    hash.bhp256 r11 into r12 as field;
    cast r0 r2[3u32] into r13 as WalletAleoSigner;
    hash.bhp256 r13 into r14 as field;
    cast r8 r10 r12 r14 into r15 as [field; 4u32];
    cast r0 r3[0u32] into r16 as WalletEcdsaSigner;
    hash.bhp256 r16 into r17 as field;
    cast r0 r3[1u32] into r18 as WalletEcdsaSigner;
    hash.bhp256 r18 into r19 as field;
    cast r0 r3[2u32] into r20 as WalletEcdsaSigner;
    hash.bhp256 r20 into r21 as field;
    cast r0 r3[3u32] into r22 as WalletEcdsaSigner;
    hash.bhp256 r22 into r23 as field;
    cast r17 r19 r21 r23 into r24 as [field; 4u32];
    async create_wallet r0 r1 r2 r3 self.caller r15 r24 into r25;
    output r25 as test_usdcx_multisig_core.aleo/create_wallet.future;

finalize create_wallet:
    input r0 as address.public;
    input r1 as u8.public;
    input r2 as [address; 4u32].public;
    input r3 as [[u8; 20u32]; 4u32].public;
    input r4 as address.public;
    input r5 as [field; 4u32].public;
    input r6 as [field; 4u32].public;
    contains program_settings_map[true] into r7;
    assert.eq r7 true;
    get program_settings_map[true] into r8;
    is.neq r0 test_usdcx_multisig_core.aleo into r9;
    and r8.guard_create_wallet r9 into r10;
    branch.eq r10 false to end_then_0_0;
    cast r0 r1 r2 r3 into r11 as GuardedCreateWalletOp;
    hash.bhp256 r11 into r12 as field;
    cast test_usdcx_multisig_core.aleo r12 into r13 as WalletSigningOpId;
    hash.bhp256 r13 into r14 as field;
    contains completed_signing_ops[r14] into r15;
    assert.eq r15 true;
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    is.eq r0 test_usdcx_multisig_core.aleo into r16;
    branch.eq r16 false to end_then_1_2;
    assert.eq r4 aleo1cytp7hvkrcw7x2myhzh9qgyhfaelpgcykp5yppjr7zdzekqz5qrs2dd7h6;
    branch.eq true true to end_otherwise_1_3;
    position end_then_1_2;
    position end_otherwise_1_3;
    position end_otherwise_0_1;
    contains wallets_map[r0] into r17;
    not r17 into r18;
    assert.eq r18 true;
    cast r0 aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r19 as WalletAleoSigner;
    hash.bhp256 r19 into r20 as field;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 into r21 as [u8; 20u32];
    cast r0 r21 into r22 as WalletEcdsaSigner;
    hash.bhp256 r22 into r23 as field;
    is.neq r5[0u32] r20 into r24;
    branch.eq r24 false to end_then_0_4;
    contains signers_map[r5[0u32]] into r25;
    not r25 into r26;
    assert.eq r26 true;
    set true into signers_map[r5[0u32]];
    branch.eq true true to end_otherwise_0_5;
    position end_then_0_4;
    position end_otherwise_0_5;
    ternary r24 1u8 0u8 into r27;
    add 0u8 r27 into r28;
    is.neq r6[0u32] r23 into r29;
    branch.eq r29 false to end_then_0_6;
    contains signers_map[r6[0u32]] into r30;
    not r30 into r31;
    assert.eq r31 true;
    set true into signers_map[r6[0u32]];
    branch.eq true true to end_otherwise_0_7;
    position end_then_0_6;
    position end_otherwise_0_7;
    ternary r29 1u8 0u8 into r32;
    add r28 r32 into r33;
    is.neq r5[1u32] r20 into r34;
    branch.eq r34 false to end_then_0_8;
    contains signers_map[r5[1u32]] into r35;
    not r35 into r36;
    assert.eq r36 true;
    set true into signers_map[r5[1u32]];
    branch.eq true true to end_otherwise_0_9;
    position end_then_0_8;
    position end_otherwise_0_9;
    ternary r34 1u8 0u8 into r37;
    add r33 r37 into r38;
    is.neq r6[1u32] r23 into r39;
    branch.eq r39 false to end_then_0_10;
    contains signers_map[r6[1u32]] into r40;
    not r40 into r41;
    assert.eq r41 true;
    set true into signers_map[r6[1u32]];
    branch.eq true true to end_otherwise_0_11;
    position end_then_0_10;
    position end_otherwise_0_11;
    ternary r39 1u8 0u8 into r42;
    add r38 r42 into r43;
    is.neq r5[2u32] r20 into r44;
    branch.eq r44 false to end_then_0_12;
    contains signers_map[r5[2u32]] into r45;
    not r45 into r46;
    assert.eq r46 true;
    set true into signers_map[r5[2u32]];
    branch.eq true true to end_otherwise_0_13;
    position end_then_0_12;
    position end_otherwise_0_13;
    ternary r44 1u8 0u8 into r47;
    add r43 r47 into r48;
    is.neq r6[2u32] r23 into r49;
    branch.eq r49 false to end_then_0_14;
    contains signers_map[r6[2u32]] into r50;
    not r50 into r51;
    assert.eq r51 true;
    set true into signers_map[r6[2u32]];
    branch.eq true true to end_otherwise_0_15;
    position end_then_0_14;
    position end_otherwise_0_15;
    ternary r49 1u8 0u8 into r52;
    add r48 r52 into r53;
    is.neq r5[3u32] r20 into r54;
    branch.eq r54 false to end_then_0_16;
    contains signers_map[r5[3u32]] into r55;
    not r55 into r56;
    assert.eq r56 true;
    set true into signers_map[r5[3u32]];
    branch.eq true true to end_otherwise_0_17;
    position end_then_0_16;
    position end_otherwise_0_17;
    ternary r54 1u8 0u8 into r57;
    add r53 r57 into r58;
    is.neq r6[3u32] r23 into r59;
    branch.eq r59 false to end_then_0_18;
    contains signers_map[r6[3u32]] into r60;
    not r60 into r61;
    assert.eq r61 true;
    set true into signers_map[r6[3u32]];
    branch.eq true true to end_otherwise_0_19;
    position end_then_0_18;
    position end_otherwise_0_19;
    ternary r59 1u8 0u8 into r62;
    add r58 r62 into r63;
    gte r63 r1 into r64;
    assert.eq r64 true;
    cast r1 r63 into r65 as WalletSettings;
    set r65 into wallets_map[r0];

function initiate_signing_op:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u32.public;
    gt r2 0u32 into r3;
    assert.eq r3 true;
    cast r0 r1 into r4 as WalletSigningOpId;
    hash.bhp256 r4 into r5 as field;
    cast r0 self.signer into r6 as WalletAleoSigner;
    hash.bhp256 r6 into r7 as field;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 into r8 as [u8; 20u32];
    cast 0u8 0u8 aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc r8 into r9 as AdminOp;
    async initiate_signing_op r0 r5 r7 r2 r9 into r10;
    output r5 as field.private;
    output r10 as test_usdcx_multisig_core.aleo/initiate_signing_op.future;

finalize initiate_signing_op:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as u32.public;
    input r4 as AdminOp.public;
    contains wallets_map[r0] into r5;
    assert.eq r5 true;
    contains completed_signing_ops[r1] into r6;
    not r6 into r7;
    assert.eq r7 true;
    contains pending_signing_ops[r1] into r8;
    not r8 into r9;
    branch.eq r9 false to end_then_0_20;
    cast 0u8 0u32 0u32 0u32 into r10 as WalletSigningOp;
    set r10 into pending_signing_ops[r1];
    branch.eq true true to end_otherwise_0_21;
    position end_then_0_20;
    position end_otherwise_0_21;
    get pending_signing_ops[r1] into r11;
    lt r11.expires_at_block block.height into r12;
    assert.eq r12 true;
    is.eq r3 4294967295u32 into r13;
    ternary r13 0u32 r3 into r14;
    add block.height r14 into r15;
    ternary r13 4294967295u32 r15 into r16;
    add r11.round 1u32 into r17;
    contains signers_map[r2] into r18;
    branch.eq r18 false to end_then_0_22;
    cast 1u8 block.height r16 r17 into r19 as WalletSigningOp;
    set r19 into pending_signing_ops[r1];
    cast r1 r2 into r20 as SigningOpConfirmation;
    hash.bhp256 r20 into r21 as field;
    get.or_use pending_signing_confirmations[r21] 0u32 into r22;
    gt r17 r22 into r23;
    assert.eq r23 true;
    set r17 into pending_signing_confirmations[r21];
    get wallets_map[r0] into r24;
    gte 1u8 r24.threshold into r25;
    branch.eq r25 false to end_then_1_24;
    set block.height into completed_signing_ops[r1];
    branch.eq true true to end_otherwise_1_25;
    position end_then_1_24;
    position end_otherwise_1_25;
    branch.eq true true to end_otherwise_0_23;
    position end_then_0_22;
    cast 0u8 block.height r16 r17 into r26 as WalletSigningOp;
    set r26 into pending_signing_ops[r1];
    position end_otherwise_0_23;
    contains pending_admin_ops[r1] into r27;
    branch.eq r27 false to end_then_0_26;
    get pending_admin_ops[r1] into r28;
    assert.eq r4 r28;
    branch.eq true true to end_otherwise_0_27;
    position end_then_0_26;
    set r4 into pending_admin_ops[r1];
    position end_otherwise_0_27;

function sign:
    input r0 as address.public;
    input r1 as field.public;
    cast r0 self.signer into r2 as WalletAleoSigner;
    hash.bhp256 r2 into r3 as field;
    async sign r0 r1 r3 0u32 into r4;
    output r4 as test_usdcx_multisig_core.aleo/sign.future;

finalize sign:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as u32.public;
    contains wallets_map[r0] into r4;
    assert.eq r4 true;
    contains signers_map[r2] into r5;
    assert.eq r5 true;
    cast r0 r1 into r6 as WalletSigningOpId;
    hash.bhp256 r6 into r7 as field;
    contains pending_signing_ops[r7] into r8;
    assert.eq r8 true;
    get pending_signing_ops[r7] into r9;
    lt r9.expires_at_block block.height into r10;
    not r10 into r11;
    assert.eq r11 true;
    is.eq r3 0u32 into r12;
    is.eq r3 r9.round into r13;
    or r12 r13 into r14;
    assert.eq r14 true;
    cast r7 r2 into r15 as SigningOpConfirmation;
    hash.bhp256 r15 into r16 as field;
    get.or_use pending_signing_confirmations[r16] 0u32 into r17;
    gt r9.round r17 into r18;
    assert.eq r18 true;
    set r9.round into pending_signing_confirmations[r16];
    add r9.confirmations 1u8 into r19;
    cast r19 r9.initiated_at_block r9.expires_at_block r9.round into r20 as WalletSigningOp;
    set r20 into pending_signing_ops[r7];
    get wallets_map[r0] into r21;
    gte r20.confirmations r21.threshold into r22;
    branch.eq r22 false to end_then_0_28;
    set block.height into completed_signing_ops[r7];
    branch.eq true true to end_otherwise_0_29;
    position end_then_0_28;
    position end_otherwise_0_29;

function sign_for_round:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u32.public;
    cast r0 self.signer into r3 as WalletAleoSigner;
    hash.bhp256 r3 into r4 as field;
    async sign_for_round r0 r1 r4 r2 into r5;
    output r5 as test_usdcx_multisig_core.aleo/sign_for_round.future;

finalize sign_for_round:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as u32.public;
    contains wallets_map[r0] into r4;
    assert.eq r4 true;
    contains signers_map[r2] into r5;
    assert.eq r5 true;
    cast r0 r1 into r6 as WalletSigningOpId;
    hash.bhp256 r6 into r7 as field;
    contains pending_signing_ops[r7] into r8;
    assert.eq r8 true;
    get pending_signing_ops[r7] into r9;
    lt r9.expires_at_block block.height into r10;
    not r10 into r11;
    assert.eq r11 true;
    is.eq r3 0u32 into r12;
    is.eq r3 r9.round into r13;
    or r12 r13 into r14;
    assert.eq r14 true;
    cast r7 r2 into r15 as SigningOpConfirmation;
    hash.bhp256 r15 into r16 as field;
    get.or_use pending_signing_confirmations[r16] 0u32 into r17;
    gt r9.round r17 into r18;
    assert.eq r18 true;
    set r9.round into pending_signing_confirmations[r16];
    add r9.confirmations 1u8 into r19;
    cast r19 r9.initiated_at_block r9.expires_at_block r9.round into r20 as WalletSigningOp;
    set r20 into pending_signing_ops[r7];
    get wallets_map[r0] into r21;
    gte r20.confirmations r21.threshold into r22;
    branch.eq r22 false to end_then_0_30;
    set block.height into completed_signing_ops[r7];
    branch.eq true true to end_otherwise_0_31;
    position end_then_0_30;
    position end_otherwise_0_31;

function sign_ecdsa:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as [u8; 20u32].public;
    input r3 as [u8; 65u32].public;
    input r4 as u64.public;
    cast r0 r2 into r5 as WalletEcdsaSigner;
    async sign_ecdsa r0 r1 r5 r3 r4 0u32 into r6;
    output r6 as test_usdcx_multisig_core.aleo/sign_ecdsa.future;

finalize sign_ecdsa:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as WalletEcdsaSigner.public;
    input r3 as [u8; 65u32].public;
    input r4 as u64.public;
    input r5 as u32.public;
    contains wallets_map[r0] into r6;
    assert.eq r6 true;
    hash.bhp256 r2 into r7 as field;
    contains signers_map[r7] into r8;
    assert.eq r8 true;
    cast r0 r1 r4 into r9 as WalletSigningOpIdNonce;
    hash.bhp256 r9 into r10 as field;
    contains used_nonces[r10] into r11;
    not r11 into r12;
    assert.eq r12 true;
    set true into used_nonces[r10];
    cast r0 r1 into r13 as WalletSigningOpId;
    hash.bhp256 r13 into r14 as field;
    contains pending_signing_ops[r14] into r15;
    assert.eq r15 true;
    get pending_signing_ops[r14] into r16;
    lt r16.expires_at_block block.height into r17;
    not r17 into r18;
    assert.eq r18 true;
    is.eq r5 0u32 into r19;
    is.eq r5 r16.round into r20;
    or r19 r20 into r21;
    assert.eq r21 true;
    serialize.bits.raw r10  (field) into r22 ([boolean; 253u32]);
    cast false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false into r23 as [boolean; 256u32];
    cast r22[0u32] r22[1u32] r22[2u32] r22[3u32] r22[4u32] r22[5u32] r22[6u32] r22[7u32] r22[8u32] r22[9u32] r22[10u32] r22[11u32] r22[12u32] r22[13u32] r22[14u32] r22[15u32] r22[16u32] r22[17u32] r22[18u32] r22[19u32] r22[20u32] r22[21u32] r22[22u32] r22[23u32] r22[24u32] r22[25u32] r22[26u32] r22[27u32] r22[28u32] r22[29u32] r22[30u32] r22[31u32] r22[32u32] r22[33u32] r22[34u32] r22[35u32] r22[36u32] r22[37u32] r22[38u32] r22[39u32] r22[40u32] r22[41u32] r22[42u32] r22[43u32] r22[44u32] r22[45u32] r22[46u32] r22[47u32] r22[48u32] r22[49u32] r22[50u32] r22[51u32] r22[52u32] r22[53u32] r22[54u32] r22[55u32] r22[56u32] r22[57u32] r22[58u32] r22[59u32] r22[60u32] r22[61u32] r22[62u32] r22[63u32] r22[64u32] r22[65u32] r22[66u32] r22[67u32] r22[68u32] r22[69u32] r22[70u32] r22[71u32] r22[72u32] r22[73u32] r22[74u32] r22[75u32] r22[76u32] r22[77u32] r22[78u32] r22[79u32] r22[80u32] r22[81u32] r22[82u32] r22[83u32] r22[84u32] r22[85u32] r22[86u32] r22[87u32] r22[88u32] r22[89u32] r22[90u32] r22[91u32] r22[92u32] r22[93u32] r22[94u32] r22[95u32] r22[96u32] r22[97u32] r22[98u32] r22[99u32] r22[100u32] r22[101u32] r22[102u32] r22[103u32] r22[104u32] r22[105u32] r22[106u32] r22[107u32] r22[108u32] r22[109u32] r22[110u32] r22[111u32] r22[112u32] r22[113u32] r22[114u32] r22[115u32] r22[116u32] r22[117u32] r22[118u32] r22[119u32] r22[120u32] r22[121u32] r22[122u32] r22[123u32] r22[124u32] r22[125u32] r22[126u32] r22[127u32] r22[128u32] r22[129u32] r22[130u32] r22[131u32] r22[132u32] r22[133u32] r22[134u32] r22[135u32] r22[136u32] r22[137u32] r22[138u32] r22[139u32] r22[140u32] r22[141u32] r22[142u32] r22[143u32] r22[144u32] r22[145u32] r22[146u32] r22[147u32] r22[148u32] r22[149u32] r22[150u32] r22[151u32] r22[152u32] r22[153u32] r22[154u32] r22[155u32] r22[156u32] r22[157u32] r22[158u32] r22[159u32] r22[160u32] r22[161u32] r22[162u32] r22[163u32] r22[164u32] r22[165u32] r22[166u32] r22[167u32] r22[168u32] r22[169u32] r22[170u32] r22[171u32] r22[172u32] r22[173u32] r22[174u32] r22[175u32] r22[176u32] r22[177u32] r22[178u32] r22[179u32] r22[180u32] r22[181u32] r22[182u32] r22[183u32] r22[184u32] r22[185u32] r22[186u32] r22[187u32] r22[188u32] r22[189u32] r22[190u32] r22[191u32] r22[192u32] r22[193u32] r22[194u32] r22[195u32] r22[196u32] r22[197u32] r22[198u32] r22[199u32] r22[200u32] r22[201u32] r22[202u32] r22[203u32] r22[204u32] r22[205u32] r22[206u32] r22[207u32] r22[208u32] r22[209u32] r22[210u32] r22[211u32] r22[212u32] r22[213u32] r22[214u32] r22[215u32] r22[216u32] r22[217u32] r22[218u32] r22[219u32] r22[220u32] r22[221u32] r22[222u32] r22[223u32] r22[224u32] r22[225u32] r22[226u32] r22[227u32] r22[228u32] r22[229u32] r22[230u32] r22[231u32] r22[232u32] r22[233u32] r22[234u32] r22[235u32] r22[236u32] r22[237u32] r22[238u32] r22[239u32] r22[240u32] r22[241u32] r22[242u32] r22[243u32] r22[244u32] r22[245u32] r22[246u32] r22[247u32] r22[248u32] r22[249u32] r22[250u32] r22[251u32] r22[252u32] r23[253u32] r23[254u32] r23[255u32] into r24 as [boolean; 256u32];
    deserialize.bits.raw r24  ([boolean; 256u32]) into r25 ([u8; 32u32]);
    cast 25u8 69u8 116u8 104u8 101u8 114u8 101u8 117u8 109u8 32u8 83u8 105u8 103u8 110u8 101u8 100u8 32u8 77u8 101u8 115u8 115u8 97u8 103u8 101u8 58u8 10u8 51u8 50u8 r25[0u32] r25[1u32] r25[2u32] r25[3u32] r25[4u32] r25[5u32] r25[6u32] r25[7u32] r25[8u32] r25[9u32] r25[10u32] r25[11u32] r25[12u32] r25[13u32] r25[14u32] r25[15u32] r25[16u32] r25[17u32] r25[18u32] r25[19u32] r25[20u32] r25[21u32] r25[22u32] r25[23u32] r25[24u32] r25[25u32] r25[26u32] r25[27u32] r25[28u32] r25[29u32] r25[30u32] r25[31u32] into r26 as [u8; 60u32];
    hash.keccak256.native.raw r26 into r27 as [boolean; 256u32];
    deserialize.bits.raw r27  ([boolean; 256u32]) into r28 ([u8; 32u32]);
    ecdsa.verify.digest.eth r3 r2.ecdsa_signer r28 into r29;
    assert.eq r29 true;
    cast r14 r7 into r30 as SigningOpConfirmation;
    hash.bhp256 r30 into r31 as field;
    get.or_use pending_signing_confirmations[r31] 0u32 into r32;
    gt r16.round r32 into r33;
    assert.eq r33 true;
    set r16.round into pending_signing_confirmations[r31];
    add r16.confirmations 1u8 into r34;
    cast r34 r16.initiated_at_block r16.expires_at_block r16.round into r35 as WalletSigningOp;
    set r35 into pending_signing_ops[r14];
    get wallets_map[r0] into r36;
    gte r35.confirmations r36.threshold into r37;
    branch.eq r37 false to end_then_0_32;
    set block.height into completed_signing_ops[r14];
    branch.eq true true to end_otherwise_0_33;
    position end_then_0_32;
    position end_otherwise_0_33;

function sign_ecdsa_for_round:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as [u8; 20u32].public;
    input r3 as [u8; 65u32].public;
    input r4 as u64.public;
    input r5 as u32.public;
    cast r0 r2 into r6 as WalletEcdsaSigner;
    async sign_ecdsa_for_round r0 r1 r6 r3 r4 r5 into r7;
    output r7 as test_usdcx_multisig_core.aleo/sign_ecdsa_for_round.future;

finalize sign_ecdsa_for_round:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as WalletEcdsaSigner.public;
    input r3 as [u8; 65u32].public;
    input r4 as u64.public;
    input r5 as u32.public;
    contains wallets_map[r0] into r6;
    assert.eq r6 true;
    hash.bhp256 r2 into r7 as field;
    contains signers_map[r7] into r8;
    assert.eq r8 true;
    cast r0 r1 r4 into r9 as WalletSigningOpIdNonce;
    hash.bhp256 r9 into r10 as field;
    contains used_nonces[r10] into r11;
    not r11 into r12;
    assert.eq r12 true;
    set true into used_nonces[r10];
    cast r0 r1 into r13 as WalletSigningOpId;
    hash.bhp256 r13 into r14 as field;
    contains pending_signing_ops[r14] into r15;
    assert.eq r15 true;
    get pending_signing_ops[r14] into r16;
    lt r16.expires_at_block block.height into r17;
    not r17 into r18;
    assert.eq r18 true;
    is.eq r5 0u32 into r19;
    is.eq r5 r16.round into r20;
    or r19 r20 into r21;
    assert.eq r21 true;
    serialize.bits.raw r10  (field) into r22 ([boolean; 253u32]);
    cast false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false false into r23 as [boolean; 256u32];
    cast r22[0u32] r22[1u32] r22[2u32] r22[3u32] r22[4u32] r22[5u32] r22[6u32] r22[7u32] r22[8u32] r22[9u32] r22[10u32] r22[11u32] r22[12u32] r22[13u32] r22[14u32] r22[15u32] r22[16u32] r22[17u32] r22[18u32] r22[19u32] r22[20u32] r22[21u32] r22[22u32] r22[23u32] r22[24u32] r22[25u32] r22[26u32] r22[27u32] r22[28u32] r22[29u32] r22[30u32] r22[31u32] r22[32u32] r22[33u32] r22[34u32] r22[35u32] r22[36u32] r22[37u32] r22[38u32] r22[39u32] r22[40u32] r22[41u32] r22[42u32] r22[43u32] r22[44u32] r22[45u32] r22[46u32] r22[47u32] r22[48u32] r22[49u32] r22[50u32] r22[51u32] r22[52u32] r22[53u32] r22[54u32] r22[55u32] r22[56u32] r22[57u32] r22[58u32] r22[59u32] r22[60u32] r22[61u32] r22[62u32] r22[63u32] r22[64u32] r22[65u32] r22[66u32] r22[67u32] r22[68u32] r22[69u32] r22[70u32] r22[71u32] r22[72u32] r22[73u32] r22[74u32] r22[75u32] r22[76u32] r22[77u32] r22[78u32] r22[79u32] r22[80u32] r22[81u32] r22[82u32] r22[83u32] r22[84u32] r22[85u32] r22[86u32] r22[87u32] r22[88u32] r22[89u32] r22[90u32] r22[91u32] r22[92u32] r22[93u32] r22[94u32] r22[95u32] r22[96u32] r22[97u32] r22[98u32] r22[99u32] r22[100u32] r22[101u32] r22[102u32] r22[103u32] r22[104u32] r22[105u32] r22[106u32] r22[107u32] r22[108u32] r22[109u32] r22[110u32] r22[111u32] r22[112u32] r22[113u32] r22[114u32] r22[115u32] r22[116u32] r22[117u32] r22[118u32] r22[119u32] r22[120u32] r22[121u32] r22[122u32] r22[123u32] r22[124u32] r22[125u32] r22[126u32] r22[127u32] r22[128u32] r22[129u32] r22[130u32] r22[131u32] r22[132u32] r22[133u32] r22[134u32] r22[135u32] r22[136u32] r22[137u32] r22[138u32] r22[139u32] r22[140u32] r22[141u32] r22[142u32] r22[143u32] r22[144u32] r22[145u32] r22[146u32] r22[147u32] r22[148u32] r22[149u32] r22[150u32] r22[151u32] r22[152u32] r22[153u32] r22[154u32] r22[155u32] r22[156u32] r22[157u32] r22[158u32] r22[159u32] r22[160u32] r22[161u32] r22[162u32] r22[163u32] r22[164u32] r22[165u32] r22[166u32] r22[167u32] r22[168u32] r22[169u32] r22[170u32] r22[171u32] r22[172u32] r22[173u32] r22[174u32] r22[175u32] r22[176u32] r22[177u32] r22[178u32] r22[179u32] r22[180u32] r22[181u32] r22[182u32] r22[183u32] r22[184u32] r22[185u32] r22[186u32] r22[187u32] r22[188u32] r22[189u32] r22[190u32] r22[191u32] r22[192u32] r22[193u32] r22[194u32] r22[195u32] r22[196u32] r22[197u32] r22[198u32] r22[199u32] r22[200u32] r22[201u32] r22[202u32] r22[203u32] r22[204u32] r22[205u32] r22[206u32] r22[207u32] r22[208u32] r22[209u32] r22[210u32] r22[211u32] r22[212u32] r22[213u32] r22[214u32] r22[215u32] r22[216u32] r22[217u32] r22[218u32] r22[219u32] r22[220u32] r22[221u32] r22[222u32] r22[223u32] r22[224u32] r22[225u32] r22[226u32] r22[227u32] r22[228u32] r22[229u32] r22[230u32] r22[231u32] r22[232u32] r22[233u32] r22[234u32] r22[235u32] r22[236u32] r22[237u32] r22[238u32] r22[239u32] r22[240u32] r22[241u32] r22[242u32] r22[243u32] r22[244u32] r22[245u32] r22[246u32] r22[247u32] r22[248u32] r22[249u32] r22[250u32] r22[251u32] r22[252u32] r23[253u32] r23[254u32] r23[255u32] into r24 as [boolean; 256u32];
    deserialize.bits.raw r24  ([boolean; 256u32]) into r25 ([u8; 32u32]);
    cast 25u8 69u8 116u8 104u8 101u8 114u8 101u8 117u8 109u8 32u8 83u8 105u8 103u8 110u8 101u8 100u8 32u8 77u8 101u8 115u8 115u8 97u8 103u8 101u8 58u8 10u8 51u8 50u8 r25[0u32] r25[1u32] r25[2u32] r25[3u32] r25[4u32] r25[5u32] r25[6u32] r25[7u32] r25[8u32] r25[9u32] r25[10u32] r25[11u32] r25[12u32] r25[13u32] r25[14u32] r25[15u32] r25[16u32] r25[17u32] r25[18u32] r25[19u32] r25[20u32] r25[21u32] r25[22u32] r25[23u32] r25[24u32] r25[25u32] r25[26u32] r25[27u32] r25[28u32] r25[29u32] r25[30u32] r25[31u32] into r26 as [u8; 60u32];
    hash.keccak256.native.raw r26 into r27 as [boolean; 256u32];
    deserialize.bits.raw r27  ([boolean; 256u32]) into r28 ([u8; 32u32]);
    ecdsa.verify.digest.eth r3 r2.ecdsa_signer r28 into r29;
    assert.eq r29 true;
    cast r14 r7 into r30 as SigningOpConfirmation;
    hash.bhp256 r30 into r31 as field;
    get.or_use pending_signing_confirmations[r31] 0u32 into r32;
    gt r16.round r32 into r33;
    assert.eq r33 true;
    set r16.round into pending_signing_confirmations[r31];
    add r16.confirmations 1u8 into r34;
    cast r34 r16.initiated_at_block r16.expires_at_block r16.round into r35 as WalletSigningOp;
    set r35 into pending_signing_ops[r14];
    get wallets_map[r0] into r36;
    gte r35.confirmations r36.threshold into r37;
    branch.eq r37 false to end_then_0_34;
    set block.height into completed_signing_ops[r14];
    branch.eq true true to end_otherwise_0_35;
    position end_then_0_34;
    position end_otherwise_0_35;

closure assert_valid_admin_op:
    input r0 as AdminOp;
    is.eq r0.op 1u8 into r1;
    not r1 into r2;
    is.neq r0.threshold 0u8 into r3;
    or r3 r2 into r4;
    assert.eq r4 true;
    is.eq r0.aleo_signer aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r5;
    or r5 r2 into r6;
    assert.eq r6 true;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 into r7 as [u8; 20u32];
    is.eq r0.ecdsa_signer r7 into r8;
    or r8 r2 into r9;
    assert.eq r9 true;
    is.eq r0.op 2u8 into r10;
    is.eq r0.op 3u8 into r11;
    or r10 r11 into r12;
    and r2 r12 into r13;
    not r13 into r14;
    is.eq r0.threshold 0u8 into r15;
    or r15 r14 into r16;
    assert.eq r16 true;
    is.eq r0.aleo_signer aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r17;
    is.eq r0.ecdsa_signer r7 into r18;
    and r17 r18 into r19;
    and r13 r19 into r20;
    not r20 into r21;
    or false r21 into r22;
    assert.eq r22 true;
    not r19 into r23;
    is.neq r0.aleo_signer aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r24;
    is.neq r0.ecdsa_signer r7 into r25;
    and r24 r25 into r26;
    and r13 r23 into r27;
    and r27 r26 into r28;
    not r28 into r29;
    or false r29 into r30;
    assert.eq r30 true;
    not r12 into r31;
    and r2 r31 into r32;
    not r32 into r33;
    or false r33 into r34;
    assert.eq r34 true;

function init_admin_op:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as u32.public;
    input r3 as AdminOp.private;
    call assert_valid_admin_op r3;
    cast r0 r1 into r4 as WalletSigningOpId;
    hash.bhp256 r4 into r5 as field;
    cast r0 self.signer into r6 as WalletAleoSigner;
    hash.bhp256 r6 into r7 as field;
    async init_admin_op r0 r5 r7 r2 r3 into r8;
    output r5 as field.private;
    output r8 as test_usdcx_multisig_core.aleo/init_admin_op.future;

finalize init_admin_op:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as u32.public;
    input r4 as AdminOp.public;
    contains wallets_map[r0] into r5;
    assert.eq r5 true;
    contains completed_signing_ops[r1] into r6;
    not r6 into r7;
    assert.eq r7 true;
    contains pending_signing_ops[r1] into r8;
    not r8 into r9;
    branch.eq r9 false to end_then_0_36;
    cast 0u8 0u32 0u32 0u32 into r10 as WalletSigningOp;
    set r10 into pending_signing_ops[r1];
    branch.eq true true to end_otherwise_0_37;
    position end_then_0_36;
    position end_otherwise_0_37;
    get pending_signing_ops[r1] into r11;
    lt r11.expires_at_block block.height into r12;
    assert.eq r12 true;
    is.eq r3 4294967295u32 into r13;
    ternary r13 0u32 r3 into r14;
    add block.height r14 into r15;
    ternary r13 4294967295u32 r15 into r16;
    add r11.round 1u32 into r17;
    contains signers_map[r2] into r18;
    branch.eq r18 false to end_then_0_38;
    cast 1u8 block.height r16 r17 into r19 as WalletSigningOp;
    set r19 into pending_signing_ops[r1];
    cast r1 r2 into r20 as SigningOpConfirmation;
    hash.bhp256 r20 into r21 as field;
    get.or_use pending_signing_confirmations[r21] 0u32 into r22;
    gt r17 r22 into r23;
    assert.eq r23 true;
    set r17 into pending_signing_confirmations[r21];
    get wallets_map[r0] into r24;
    gte 1u8 r24.threshold into r25;
    branch.eq r25 false to end_then_1_40;
    set block.height into completed_signing_ops[r1];
    branch.eq true true to end_otherwise_1_41;
    position end_then_1_40;
    position end_otherwise_1_41;
    branch.eq true true to end_otherwise_0_39;
    position end_then_0_38;
    cast 0u8 block.height r16 r17 into r26 as WalletSigningOp;
    set r26 into pending_signing_ops[r1];
    position end_otherwise_0_39;
    contains pending_admin_ops[r1] into r27;
    branch.eq r27 false to end_then_0_42;
    get pending_admin_ops[r1] into r28;
    assert.eq r4 r28;
    branch.eq true true to end_otherwise_0_43;
    position end_then_0_42;
    set r4 into pending_admin_ops[r1];
    position end_otherwise_0_43;

function exec_admin_op:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as AdminOp.private;
    call assert_valid_admin_op r2;
    cast r0 r1 into r3 as WalletSigningOpId;
    hash.bhp256 r3 into r4 as field;
    async exec_admin_op r0 r4 r2 into r5;
    output r5 as test_usdcx_multisig_core.aleo/exec_admin_op.future;

finalize exec_admin_op:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as AdminOp.public;
    contains wallets_map[r0] into r3;
    assert.eq r3 true;
    contains completed_signing_ops[r1] into r4;
    assert.eq r4 true;
    get pending_admin_ops[r1] into r5;
    assert.eq r5 r2;
    remove pending_admin_ops[r1];
    get wallets_map[r0] into r6;
    is.eq r2.op 1u8 into r7;
    branch.eq r7 false to end_then_0_44;
    lte r2.threshold r6.num_signers into r8;
    assert.eq r8 true;
    cast r2.threshold r6.num_signers into r9 as WalletSettings;
    set r9 into wallets_map[r0];
    branch.eq true true to end_otherwise_0_45;
    position end_then_0_44;
    is.eq r2.op 2u8 into r10;
    branch.eq r10 false to end_then_1_46;
    is.eq r2.op 2u8 into r11;
    is.eq r2.op 3u8 into r12;
    or r11 r12 into r13;
    assert.eq r13 true;
    is.neq r2.aleo_signer aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r14;
    cast r0 r2.aleo_signer into r15 as WalletAleoSigner;
    hash.bhp256 r15 into r16 as field;
    ternary r14 r16 0field into r17;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 into r18 as [u8; 20u32];
    is.neq r2.ecdsa_signer r18 into r19;
    not r19 into r20;
    is.eq r17 0field into r21;
    or r21 r20 into r22;
    assert.eq r22 true;
    cast r0 r2.ecdsa_signer into r23 as WalletEcdsaSigner;
    hash.bhp256 r23 into r24 as field;
    ternary r19 r24 r17 into r25;
    assert.neq r25 0field;
    contains signers_map[r25] into r26;
    not r26 into r27;
    assert.eq r27 true;
    set true into signers_map[r25];
    add r6.num_signers 1u8 into r28;
    cast r6.threshold r28 into r29 as WalletSettings;
    set r29 into wallets_map[r0];
    branch.eq true true to end_otherwise_1_47;
    position end_then_1_46;
    is.eq r2.op 3u8 into r30;
    branch.eq r30 false to end_then_2_48;
    is.eq r2.op 2u8 into r31;
    is.eq r2.op 3u8 into r32;
    or r31 r32 into r33;
    assert.eq r33 true;
    is.neq r2.aleo_signer aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r34;
    cast r0 r2.aleo_signer into r35 as WalletAleoSigner;
    hash.bhp256 r35 into r36 as field;
    ternary r34 r36 0field into r37;
    cast 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 into r38 as [u8; 20u32];
    is.neq r2.ecdsa_signer r38 into r39;
    not r39 into r40;
    is.eq r37 0field into r41;
    or r41 r40 into r42;
    assert.eq r42 true;
    cast r0 r2.ecdsa_signer into r43 as WalletEcdsaSigner;
    hash.bhp256 r43 into r44 as field;
    ternary r39 r44 r37 into r45;
    assert.neq r45 0field;
    contains signers_map[r45] into r46;
    assert.eq r46 true;
    remove signers_map[r45];
    sub r6.num_signers 1u8 into r47;
    gte r47 r6.threshold into r48;
    assert.eq r48 true;
    sub r6.num_signers 1u8 into r49;
    cast r6.threshold r49 into r50 as WalletSettings;
    set r50 into wallets_map[r0];
    branch.eq true true to end_otherwise_2_49;
    position end_then_2_48;
    assert.eq false true;
    position end_otherwise_2_49;
    position end_otherwise_1_47;
    position end_otherwise_0_45;

closure get_signing_op_id_hash_fn:
    input r0 as address;
    input r1 as field;
    cast r0 r1 into r2 as WalletSigningOpId;
    hash.bhp256 r2 into r3 as field;
    output r3 as field;

function get_signing_op_id_hash:
    input r0 as address.public;
    input r1 as field.public;
    call get_signing_op_id_hash_fn r0 r1 into r2;
    output r2 as field.private;

function guarded_create_wallet_op_hash:
    input r0 as address.public;
    input r1 as u8.public;
    input r2 as [address; 4u32].private;
    input r3 as [[u8; 20u32]; 4u32].private;
    cast r0 r1 r2 r3 into r4 as GuardedCreateWalletOp;
    hash.bhp256 r4 into r5 as field;
    output r5 as field.private;

function assert_signing_completed:
    input r0 as address.public;
    input r1 as field.public;
    async assert_signing_completed r0 r1 into r2;
    output r2 as test_usdcx_multisig_core.aleo/assert_signing_completed.future;

finalize assert_signing_completed:
    input r0 as address.public;
    input r1 as field.public;
    cast r0 r1 into r2 as WalletSigningOpId;
    hash.bhp256 r2 into r3 as field;
    contains completed_signing_ops[r3] into r4;
    assert.eq r4 true;

constructor:
    is.eq edition 0u16 into r0;
    branch.eq r0 false to end_then_0_50;
    assert.eq program_owner aleo1cytp7hvkrcw7x2myhzh9qgyhfaelpgcykp5yppjr7zdzekqz5qrs2dd7h6;
    branch.eq true true to end_otherwise_0_51;
    position end_then_0_50;
    contains program_settings_map[true] into r1;
    assert.eq r1 true;
    get program_settings_map[true] into r2;
    assert.eq r2.allow_upgrades true;
    assert.eq program_owner r2.upgrader_address;
    position end_otherwise_0_51;
