import merkle_tree.aleo;
import usad_multisig_core.aleo;
import usad_freezelist.aleo;
import usad_stablecoin.aleo;
program ldg_usad_p2p_1113.aleo;

function transfer_private_to_public_11:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as usad_stablecoin.aleo/Token.record;
    input r6 as usad_stablecoin.aleo/Token.record;
    input r7 as usad_stablecoin.aleo/Token.record;
    input r8 as usad_stablecoin.aleo/Token.record;
    input r9 as usad_stablecoin.aleo/Token.record;
    input r10 as usad_stablecoin.aleo/Token.record;
    input r11 as address.public;
    input r12 as u128.public;
    input r13 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r14;
    call usad_stablecoin.aleo/join r2 r14 into r15;
    call usad_stablecoin.aleo/join r3 r15 into r16;
    call usad_stablecoin.aleo/join r4 r16 into r17;
    call usad_stablecoin.aleo/join r5 r17 into r18;
    call usad_stablecoin.aleo/join r6 r18 into r19;
    call usad_stablecoin.aleo/join r7 r19 into r20;
    call usad_stablecoin.aleo/join r8 r20 into r21;
    call usad_stablecoin.aleo/join r9 r21 into r22;
    call usad_stablecoin.aleo/join r10 r22 into r23;
    call usad_stablecoin.aleo/transfer_private_to_public r11 r12 r23 r13 into r24 r25 r26;
    async transfer_private_to_public_11 r26 into r27;
    output r24 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r25 as usad_stablecoin.aleo/Token.record;
    output r27 as ldg_usad_p2p_1113.aleo/transfer_private_to_public_11.future;

finalize transfer_private_to_public_11:
    input r0 as usad_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_12:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as usad_stablecoin.aleo/Token.record;
    input r6 as usad_stablecoin.aleo/Token.record;
    input r7 as usad_stablecoin.aleo/Token.record;
    input r8 as usad_stablecoin.aleo/Token.record;
    input r9 as usad_stablecoin.aleo/Token.record;
    input r10 as usad_stablecoin.aleo/Token.record;
    input r11 as usad_stablecoin.aleo/Token.record;
    input r12 as address.public;
    input r13 as u128.public;
    input r14 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r15;
    call usad_stablecoin.aleo/join r2 r15 into r16;
    call usad_stablecoin.aleo/join r3 r16 into r17;
    call usad_stablecoin.aleo/join r4 r17 into r18;
    call usad_stablecoin.aleo/join r5 r18 into r19;
    call usad_stablecoin.aleo/join r6 r19 into r20;
    call usad_stablecoin.aleo/join r7 r20 into r21;
    call usad_stablecoin.aleo/join r8 r21 into r22;
    call usad_stablecoin.aleo/join r9 r22 into r23;
    call usad_stablecoin.aleo/join r10 r23 into r24;
    call usad_stablecoin.aleo/join r11 r24 into r25;
    call usad_stablecoin.aleo/transfer_private_to_public r12 r13 r25 r14 into r26 r27 r28;
    async transfer_private_to_public_12 r28 into r29;
    output r26 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r27 as usad_stablecoin.aleo/Token.record;
    output r29 as ldg_usad_p2p_1113.aleo/transfer_private_to_public_12.future;

finalize transfer_private_to_public_12:
    input r0 as usad_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_13:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as usad_stablecoin.aleo/Token.record;
    input r6 as usad_stablecoin.aleo/Token.record;
    input r7 as usad_stablecoin.aleo/Token.record;
    input r8 as usad_stablecoin.aleo/Token.record;
    input r9 as usad_stablecoin.aleo/Token.record;
    input r10 as usad_stablecoin.aleo/Token.record;
    input r11 as usad_stablecoin.aleo/Token.record;
    input r12 as usad_stablecoin.aleo/Token.record;
    input r13 as address.public;
    input r14 as u128.public;
    input r15 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r16;
    call usad_stablecoin.aleo/join r2 r16 into r17;
    call usad_stablecoin.aleo/join r3 r17 into r18;
    call usad_stablecoin.aleo/join r4 r18 into r19;
    call usad_stablecoin.aleo/join r5 r19 into r20;
    call usad_stablecoin.aleo/join r6 r20 into r21;
    call usad_stablecoin.aleo/join r7 r21 into r22;
    call usad_stablecoin.aleo/join r8 r22 into r23;
    call usad_stablecoin.aleo/join r9 r23 into r24;
    call usad_stablecoin.aleo/join r10 r24 into r25;
    call usad_stablecoin.aleo/join r11 r25 into r26;
    call usad_stablecoin.aleo/join r12 r26 into r27;
    call usad_stablecoin.aleo/transfer_private_to_public r13 r14 r27 r15 into r28 r29 r30;
    async transfer_private_to_public_13 r30 into r31;
    output r28 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r29 as usad_stablecoin.aleo/Token.record;
    output r31 as ldg_usad_p2p_1113.aleo/transfer_private_to_public_13.future;

finalize transfer_private_to_public_13:
    input r0 as usad_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

constructor:
    assert.eq edition 0u16;
