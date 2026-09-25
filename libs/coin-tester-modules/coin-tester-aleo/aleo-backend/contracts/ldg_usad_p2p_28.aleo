import merkle_tree.aleo;
import usad_multisig_core.aleo;
import usad_freezelist.aleo;
import usad_stablecoin.aleo;
program ldg_usad_p2p_28.aleo;

function transfer_private_to_public_2:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as address.public;
    input r3 as u128.public;
    input r4 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r5;
    call usad_stablecoin.aleo/transfer_private_to_public r2 r3 r5 r4 into r6 r7 r8;
    async transfer_private_to_public_2 r8 into r9;
    output r6 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r7 as usad_stablecoin.aleo/Token.record;
    output r9 as ldg_usad_p2p_28.aleo/transfer_private_to_public_2.future;

finalize transfer_private_to_public_2:
    input r0 as usad_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_3:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as address.public;
    input r4 as u128.public;
    input r5 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r6;
    call usad_stablecoin.aleo/join r2 r6 into r7;
    call usad_stablecoin.aleo/transfer_private_to_public r3 r4 r7 r5 into r8 r9 r10;
    async transfer_private_to_public_3 r10 into r11;
    output r8 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r9 as usad_stablecoin.aleo/Token.record;
    output r11 as ldg_usad_p2p_28.aleo/transfer_private_to_public_3.future;

finalize transfer_private_to_public_3:
    input r0 as usad_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_4:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as address.public;
    input r5 as u128.public;
    input r6 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r7;
    call usad_stablecoin.aleo/join r2 r7 into r8;
    call usad_stablecoin.aleo/join r3 r8 into r9;
    call usad_stablecoin.aleo/transfer_private_to_public r4 r5 r9 r6 into r10 r11 r12;
    async transfer_private_to_public_4 r12 into r13;
    output r10 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r11 as usad_stablecoin.aleo/Token.record;
    output r13 as ldg_usad_p2p_28.aleo/transfer_private_to_public_4.future;

finalize transfer_private_to_public_4:
    input r0 as usad_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_5:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as address.public;
    input r6 as u128.public;
    input r7 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r8;
    call usad_stablecoin.aleo/join r2 r8 into r9;
    call usad_stablecoin.aleo/join r3 r9 into r10;
    call usad_stablecoin.aleo/join r4 r10 into r11;
    call usad_stablecoin.aleo/transfer_private_to_public r5 r6 r11 r7 into r12 r13 r14;
    async transfer_private_to_public_5 r14 into r15;
    output r12 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r13 as usad_stablecoin.aleo/Token.record;
    output r15 as ldg_usad_p2p_28.aleo/transfer_private_to_public_5.future;

finalize transfer_private_to_public_5:
    input r0 as usad_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_6:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as usad_stablecoin.aleo/Token.record;
    input r6 as address.public;
    input r7 as u128.public;
    input r8 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r9;
    call usad_stablecoin.aleo/join r2 r9 into r10;
    call usad_stablecoin.aleo/join r3 r10 into r11;
    call usad_stablecoin.aleo/join r4 r11 into r12;
    call usad_stablecoin.aleo/join r5 r12 into r13;
    call usad_stablecoin.aleo/transfer_private_to_public r6 r7 r13 r8 into r14 r15 r16;
    async transfer_private_to_public_6 r16 into r17;
    output r14 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r15 as usad_stablecoin.aleo/Token.record;
    output r17 as ldg_usad_p2p_28.aleo/transfer_private_to_public_6.future;

finalize transfer_private_to_public_6:
    input r0 as usad_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_7:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as usad_stablecoin.aleo/Token.record;
    input r6 as usad_stablecoin.aleo/Token.record;
    input r7 as address.public;
    input r8 as u128.public;
    input r9 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r10;
    call usad_stablecoin.aleo/join r2 r10 into r11;
    call usad_stablecoin.aleo/join r3 r11 into r12;
    call usad_stablecoin.aleo/join r4 r12 into r13;
    call usad_stablecoin.aleo/join r5 r13 into r14;
    call usad_stablecoin.aleo/join r6 r14 into r15;
    call usad_stablecoin.aleo/transfer_private_to_public r7 r8 r15 r9 into r16 r17 r18;
    async transfer_private_to_public_7 r18 into r19;
    output r16 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r17 as usad_stablecoin.aleo/Token.record;
    output r19 as ldg_usad_p2p_28.aleo/transfer_private_to_public_7.future;

finalize transfer_private_to_public_7:
    input r0 as usad_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_8:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as usad_stablecoin.aleo/Token.record;
    input r6 as usad_stablecoin.aleo/Token.record;
    input r7 as usad_stablecoin.aleo/Token.record;
    input r8 as address.public;
    input r9 as u128.public;
    input r10 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r11;
    call usad_stablecoin.aleo/join r2 r11 into r12;
    call usad_stablecoin.aleo/join r3 r12 into r13;
    call usad_stablecoin.aleo/join r4 r13 into r14;
    call usad_stablecoin.aleo/join r5 r14 into r15;
    call usad_stablecoin.aleo/join r6 r15 into r16;
    call usad_stablecoin.aleo/join r7 r16 into r17;
    call usad_stablecoin.aleo/transfer_private_to_public r8 r9 r17 r10 into r18 r19 r20;
    async transfer_private_to_public_8 r20 into r21;
    output r18 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r19 as usad_stablecoin.aleo/Token.record;
    output r21 as ldg_usad_p2p_28.aleo/transfer_private_to_public_8.future;

finalize transfer_private_to_public_8:
    input r0 as usad_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

constructor:
    assert.eq edition 0u16;
