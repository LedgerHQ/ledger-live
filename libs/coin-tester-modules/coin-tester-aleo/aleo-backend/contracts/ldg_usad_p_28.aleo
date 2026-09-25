import merkle_tree.aleo;
import usad_multisig_core.aleo;
import usad_freezelist.aleo;
import usad_stablecoin.aleo;
program ldg_usad_p_28.aleo;

function transfer_private_2:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as address.private;
    input r3 as u128.private;
    input r4 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r5;
    call usad_stablecoin.aleo/transfer_private r2 r3 r5 r4 into r6 r7 r8 r9;
    async transfer_private_2 r9 into r10;
    output r6 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r7 as usad_stablecoin.aleo/Token.record;
    output r8 as usad_stablecoin.aleo/Token.record;
    output r10 as ldg_usad_p_28.aleo/transfer_private_2.future;

finalize transfer_private_2:
    input r0 as usad_stablecoin.aleo/transfer_private.future;
    await r0;

function transfer_private_3:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as address.private;
    input r4 as u128.private;
    input r5 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r6;
    call usad_stablecoin.aleo/join r2 r6 into r7;
    call usad_stablecoin.aleo/transfer_private r3 r4 r7 r5 into r8 r9 r10 r11;
    async transfer_private_3 r11 into r12;
    output r8 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r9 as usad_stablecoin.aleo/Token.record;
    output r10 as usad_stablecoin.aleo/Token.record;
    output r12 as ldg_usad_p_28.aleo/transfer_private_3.future;

finalize transfer_private_3:
    input r0 as usad_stablecoin.aleo/transfer_private.future;
    await r0;

function transfer_private_4:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as address.private;
    input r5 as u128.private;
    input r6 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r7;
    call usad_stablecoin.aleo/join r2 r7 into r8;
    call usad_stablecoin.aleo/join r3 r8 into r9;
    call usad_stablecoin.aleo/transfer_private r4 r5 r9 r6 into r10 r11 r12 r13;
    async transfer_private_4 r13 into r14;
    output r10 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r11 as usad_stablecoin.aleo/Token.record;
    output r12 as usad_stablecoin.aleo/Token.record;
    output r14 as ldg_usad_p_28.aleo/transfer_private_4.future;

finalize transfer_private_4:
    input r0 as usad_stablecoin.aleo/transfer_private.future;
    await r0;

function transfer_private_5:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as address.private;
    input r6 as u128.private;
    input r7 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r8;
    call usad_stablecoin.aleo/join r2 r8 into r9;
    call usad_stablecoin.aleo/join r3 r9 into r10;
    call usad_stablecoin.aleo/join r4 r10 into r11;
    call usad_stablecoin.aleo/transfer_private r5 r6 r11 r7 into r12 r13 r14 r15;
    async transfer_private_5 r15 into r16;
    output r12 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r13 as usad_stablecoin.aleo/Token.record;
    output r14 as usad_stablecoin.aleo/Token.record;
    output r16 as ldg_usad_p_28.aleo/transfer_private_5.future;

finalize transfer_private_5:
    input r0 as usad_stablecoin.aleo/transfer_private.future;
    await r0;

function transfer_private_6:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as usad_stablecoin.aleo/Token.record;
    input r6 as address.private;
    input r7 as u128.private;
    input r8 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r9;
    call usad_stablecoin.aleo/join r2 r9 into r10;
    call usad_stablecoin.aleo/join r3 r10 into r11;
    call usad_stablecoin.aleo/join r4 r11 into r12;
    call usad_stablecoin.aleo/join r5 r12 into r13;
    call usad_stablecoin.aleo/transfer_private r6 r7 r13 r8 into r14 r15 r16 r17;
    async transfer_private_6 r17 into r18;
    output r14 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r15 as usad_stablecoin.aleo/Token.record;
    output r16 as usad_stablecoin.aleo/Token.record;
    output r18 as ldg_usad_p_28.aleo/transfer_private_6.future;

finalize transfer_private_6:
    input r0 as usad_stablecoin.aleo/transfer_private.future;
    await r0;

function transfer_private_7:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as usad_stablecoin.aleo/Token.record;
    input r6 as usad_stablecoin.aleo/Token.record;
    input r7 as address.private;
    input r8 as u128.private;
    input r9 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r10;
    call usad_stablecoin.aleo/join r2 r10 into r11;
    call usad_stablecoin.aleo/join r3 r11 into r12;
    call usad_stablecoin.aleo/join r4 r12 into r13;
    call usad_stablecoin.aleo/join r5 r13 into r14;
    call usad_stablecoin.aleo/join r6 r14 into r15;
    call usad_stablecoin.aleo/transfer_private r7 r8 r15 r9 into r16 r17 r18 r19;
    async transfer_private_7 r19 into r20;
    output r16 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r17 as usad_stablecoin.aleo/Token.record;
    output r18 as usad_stablecoin.aleo/Token.record;
    output r20 as ldg_usad_p_28.aleo/transfer_private_7.future;

finalize transfer_private_7:
    input r0 as usad_stablecoin.aleo/transfer_private.future;
    await r0;

function transfer_private_8:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as usad_stablecoin.aleo/Token.record;
    input r6 as usad_stablecoin.aleo/Token.record;
    input r7 as usad_stablecoin.aleo/Token.record;
    input r8 as address.private;
    input r9 as u128.private;
    input r10 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r11;
    call usad_stablecoin.aleo/join r2 r11 into r12;
    call usad_stablecoin.aleo/join r3 r12 into r13;
    call usad_stablecoin.aleo/join r4 r13 into r14;
    call usad_stablecoin.aleo/join r5 r14 into r15;
    call usad_stablecoin.aleo/join r6 r15 into r16;
    call usad_stablecoin.aleo/join r7 r16 into r17;
    call usad_stablecoin.aleo/transfer_private r8 r9 r17 r10 into r18 r19 r20 r21;
    async transfer_private_8 r21 into r22;
    output r18 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r19 as usad_stablecoin.aleo/Token.record;
    output r20 as usad_stablecoin.aleo/Token.record;
    output r22 as ldg_usad_p_28.aleo/transfer_private_8.future;

finalize transfer_private_8:
    input r0 as usad_stablecoin.aleo/transfer_private.future;
    await r0;

constructor:
    assert.eq edition 0u16;
