import credits.aleo;

program ldg_p2p_28.aleo;

function transfer_private_to_public_2:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as u64.public;
    call credits.aleo/join r0 r1 into r3;
    call credits.aleo/transfer_private_to_public r3 self.signer r2 into r4 r5;
    async transfer_private_to_public_2 r5 into r6;
    output r4 as credits.aleo/credits.record;
    output r6 as ldg_p2p_28.aleo/transfer_private_to_public_2.future;

finalize transfer_private_to_public_2:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_3:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as u64.public;
    call credits.aleo/join r0 r1 into r4;
    call credits.aleo/join r2 r4 into r5;
    call credits.aleo/transfer_private_to_public r5 self.signer r3 into r6 r7;
    async transfer_private_to_public_3 r7 into r8;
    output r6 as credits.aleo/credits.record;
    output r8 as ldg_p2p_28.aleo/transfer_private_to_public_3.future;

finalize transfer_private_to_public_3:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_4:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as u64.public;
    call credits.aleo/join r0 r1 into r5;
    call credits.aleo/join r2 r5 into r6;
    call credits.aleo/join r3 r6 into r7;
    call credits.aleo/transfer_private_to_public r7 self.signer r4 into r8 r9;
    async transfer_private_to_public_4 r9 into r10;
    output r8 as credits.aleo/credits.record;
    output r10 as ldg_p2p_28.aleo/transfer_private_to_public_4.future;

finalize transfer_private_to_public_4:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_5:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as u64.public;
    call credits.aleo/join r0 r1 into r6;
    call credits.aleo/join r2 r6 into r7;
    call credits.aleo/join r3 r7 into r8;
    call credits.aleo/join r4 r8 into r9;
    call credits.aleo/transfer_private_to_public r9 self.signer r5 into r10 r11;
    async transfer_private_to_public_5 r11 into r12;
    output r10 as credits.aleo/credits.record;
    output r12 as ldg_p2p_28.aleo/transfer_private_to_public_5.future;

finalize transfer_private_to_public_5:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_6:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as credits.aleo/credits.record;
    input r6 as u64.public;
    call credits.aleo/join r0 r1 into r7;
    call credits.aleo/join r2 r7 into r8;
    call credits.aleo/join r3 r8 into r9;
    call credits.aleo/join r4 r9 into r10;
    call credits.aleo/join r5 r10 into r11;
    call credits.aleo/transfer_private_to_public r11 self.signer r6 into r12 r13;
    async transfer_private_to_public_6 r13 into r14;
    output r12 as credits.aleo/credits.record;
    output r14 as ldg_p2p_28.aleo/transfer_private_to_public_6.future;

finalize transfer_private_to_public_6:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_7:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as credits.aleo/credits.record;
    input r6 as credits.aleo/credits.record;
    input r7 as u64.public;
    call credits.aleo/join r0 r1 into r8;
    call credits.aleo/join r2 r8 into r9;
    call credits.aleo/join r3 r9 into r10;
    call credits.aleo/join r4 r10 into r11;
    call credits.aleo/join r5 r11 into r12;
    call credits.aleo/join r6 r12 into r13;
    call credits.aleo/transfer_private_to_public r13 self.signer r7 into r14 r15;
    async transfer_private_to_public_7 r15 into r16;
    output r14 as credits.aleo/credits.record;
    output r16 as ldg_p2p_28.aleo/transfer_private_to_public_7.future;

finalize transfer_private_to_public_7:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_8:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as credits.aleo/credits.record;
    input r6 as credits.aleo/credits.record;
    input r7 as credits.aleo/credits.record;
    input r8 as u64.public;
    call credits.aleo/join r0 r1 into r9;
    call credits.aleo/join r2 r9 into r10;
    call credits.aleo/join r3 r10 into r11;
    call credits.aleo/join r4 r11 into r12;
    call credits.aleo/join r5 r12 into r13;
    call credits.aleo/join r6 r13 into r14;
    call credits.aleo/join r7 r14 into r15;
    call credits.aleo/transfer_private_to_public r15 self.signer r8 into r16 r17;
    async transfer_private_to_public_8 r17 into r18;
    output r16 as credits.aleo/credits.record;
    output r18 as ldg_p2p_28.aleo/transfer_private_to_public_8.future;

finalize transfer_private_to_public_8:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

constructor:
    assert.eq edition 0u16;
