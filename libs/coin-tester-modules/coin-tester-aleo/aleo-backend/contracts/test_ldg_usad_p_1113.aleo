import merkle_tree.aleo;
import test_usad_multisig_core.aleo;
import test_usad_freezelist.aleo;
import test_usad_stablecoin.aleo;

program ldg_usad_p_1113.aleo;

function transfer_private_11:
    input r0 as test_usad_stablecoin.aleo/Token.record;
    input r1 as test_usad_stablecoin.aleo/Token.record;
    input r2 as test_usad_stablecoin.aleo/Token.record;
    input r3 as test_usad_stablecoin.aleo/Token.record;
    input r4 as test_usad_stablecoin.aleo/Token.record;
    input r5 as test_usad_stablecoin.aleo/Token.record;
    input r6 as test_usad_stablecoin.aleo/Token.record;
    input r7 as test_usad_stablecoin.aleo/Token.record;
    input r8 as test_usad_stablecoin.aleo/Token.record;
    input r9 as test_usad_stablecoin.aleo/Token.record;
    input r10 as test_usad_stablecoin.aleo/Token.record;
    input r11 as address.private;
    input r12 as u128.private;
    input r13 as [test_usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call test_usad_stablecoin.aleo/join r0 r1 into r14;
    call test_usad_stablecoin.aleo/join r2 r14 into r15;
    call test_usad_stablecoin.aleo/join r3 r15 into r16;
    call test_usad_stablecoin.aleo/join r4 r16 into r17;
    call test_usad_stablecoin.aleo/join r5 r17 into r18;
    call test_usad_stablecoin.aleo/join r6 r18 into r19;
    call test_usad_stablecoin.aleo/join r7 r19 into r20;
    call test_usad_stablecoin.aleo/join r8 r20 into r21;
    call test_usad_stablecoin.aleo/join r9 r21 into r22;
    call test_usad_stablecoin.aleo/join r10 r22 into r23;
    call test_usad_stablecoin.aleo/transfer_private r11 r12 r23 r13 into r24 r25 r26 r27;
    async transfer_private_11 r27 into r28;
    output r24 as test_usad_stablecoin.aleo/ComplianceRecord.record;
    output r25 as test_usad_stablecoin.aleo/Token.record;
    output r26 as test_usad_stablecoin.aleo/Token.record;
    output r28 as ldg_usad_p_1113.aleo/transfer_private_11.future;

finalize transfer_private_11:
    input r0 as test_usad_stablecoin.aleo/transfer_private.future;
    await r0;

function transfer_private_12:
    input r0 as test_usad_stablecoin.aleo/Token.record;
    input r1 as test_usad_stablecoin.aleo/Token.record;
    input r2 as test_usad_stablecoin.aleo/Token.record;
    input r3 as test_usad_stablecoin.aleo/Token.record;
    input r4 as test_usad_stablecoin.aleo/Token.record;
    input r5 as test_usad_stablecoin.aleo/Token.record;
    input r6 as test_usad_stablecoin.aleo/Token.record;
    input r7 as test_usad_stablecoin.aleo/Token.record;
    input r8 as test_usad_stablecoin.aleo/Token.record;
    input r9 as test_usad_stablecoin.aleo/Token.record;
    input r10 as test_usad_stablecoin.aleo/Token.record;
    input r11 as test_usad_stablecoin.aleo/Token.record;
    input r12 as address.private;
    input r13 as u128.private;
    input r14 as [test_usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call test_usad_stablecoin.aleo/join r0 r1 into r15;
    call test_usad_stablecoin.aleo/join r2 r15 into r16;
    call test_usad_stablecoin.aleo/join r3 r16 into r17;
    call test_usad_stablecoin.aleo/join r4 r17 into r18;
    call test_usad_stablecoin.aleo/join r5 r18 into r19;
    call test_usad_stablecoin.aleo/join r6 r19 into r20;
    call test_usad_stablecoin.aleo/join r7 r20 into r21;
    call test_usad_stablecoin.aleo/join r8 r21 into r22;
    call test_usad_stablecoin.aleo/join r9 r22 into r23;
    call test_usad_stablecoin.aleo/join r10 r23 into r24;
    call test_usad_stablecoin.aleo/join r11 r24 into r25;
    call test_usad_stablecoin.aleo/transfer_private r12 r13 r25 r14 into r26 r27 r28 r29;
    async transfer_private_12 r29 into r30;
    output r26 as test_usad_stablecoin.aleo/ComplianceRecord.record;
    output r27 as test_usad_stablecoin.aleo/Token.record;
    output r28 as test_usad_stablecoin.aleo/Token.record;
    output r30 as ldg_usad_p_1113.aleo/transfer_private_12.future;

finalize transfer_private_12:
    input r0 as test_usad_stablecoin.aleo/transfer_private.future;
    await r0;

function transfer_private_13:
    input r0 as test_usad_stablecoin.aleo/Token.record;
    input r1 as test_usad_stablecoin.aleo/Token.record;
    input r2 as test_usad_stablecoin.aleo/Token.record;
    input r3 as test_usad_stablecoin.aleo/Token.record;
    input r4 as test_usad_stablecoin.aleo/Token.record;
    input r5 as test_usad_stablecoin.aleo/Token.record;
    input r6 as test_usad_stablecoin.aleo/Token.record;
    input r7 as test_usad_stablecoin.aleo/Token.record;
    input r8 as test_usad_stablecoin.aleo/Token.record;
    input r9 as test_usad_stablecoin.aleo/Token.record;
    input r10 as test_usad_stablecoin.aleo/Token.record;
    input r11 as test_usad_stablecoin.aleo/Token.record;
    input r12 as test_usad_stablecoin.aleo/Token.record;
    input r13 as address.private;
    input r14 as u128.private;
    input r15 as [test_usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call test_usad_stablecoin.aleo/join r0 r1 into r16;
    call test_usad_stablecoin.aleo/join r2 r16 into r17;
    call test_usad_stablecoin.aleo/join r3 r17 into r18;
    call test_usad_stablecoin.aleo/join r4 r18 into r19;
    call test_usad_stablecoin.aleo/join r5 r19 into r20;
    call test_usad_stablecoin.aleo/join r6 r20 into r21;
    call test_usad_stablecoin.aleo/join r7 r21 into r22;
    call test_usad_stablecoin.aleo/join r8 r22 into r23;
    call test_usad_stablecoin.aleo/join r9 r23 into r24;
    call test_usad_stablecoin.aleo/join r10 r24 into r25;
    call test_usad_stablecoin.aleo/join r11 r25 into r26;
    call test_usad_stablecoin.aleo/join r12 r26 into r27;
    call test_usad_stablecoin.aleo/transfer_private r13 r14 r27 r15 into r28 r29 r30 r31;
    async transfer_private_13 r31 into r32;
    output r28 as test_usad_stablecoin.aleo/ComplianceRecord.record;
    output r29 as test_usad_stablecoin.aleo/Token.record;
    output r30 as test_usad_stablecoin.aleo/Token.record;
    output r32 as ldg_usad_p_1113.aleo/transfer_private_13.future;

finalize transfer_private_13:
    input r0 as test_usad_stablecoin.aleo/transfer_private.future;
    await r0;

constructor:
    assert.eq edition 0u16;
