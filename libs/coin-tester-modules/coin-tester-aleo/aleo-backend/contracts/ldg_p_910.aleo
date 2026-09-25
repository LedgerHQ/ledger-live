import credits.aleo;

program ldg_p_910.aleo;

function transfer_private_9:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as credits.aleo/credits.record;
    input r6 as credits.aleo/credits.record;
    input r7 as credits.aleo/credits.record;
    input r8 as credits.aleo/credits.record;
    input r9 as address.private;
    input r10 as u64.private;
    call credits.aleo/join r0 r1 into r11;
    call credits.aleo/join r2 r11 into r12;
    call credits.aleo/join r3 r12 into r13;
    call credits.aleo/join r4 r13 into r14;
    call credits.aleo/join r5 r14 into r15;
    call credits.aleo/join r6 r15 into r16;
    call credits.aleo/join r7 r16 into r17;
    call credits.aleo/join r8 r17 into r18;
    call credits.aleo/transfer_private r18 r9 r10 into r19 r20;
    output r19 as credits.aleo/credits.record;
    output r20 as credits.aleo/credits.record;

function transfer_private_10:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as credits.aleo/credits.record;
    input r6 as credits.aleo/credits.record;
    input r7 as credits.aleo/credits.record;
    input r8 as credits.aleo/credits.record;
    input r9 as credits.aleo/credits.record;
    input r10 as address.private;
    input r11 as u64.private;
    call credits.aleo/join r0 r1 into r12;
    call credits.aleo/join r2 r12 into r13;
    call credits.aleo/join r3 r13 into r14;
    call credits.aleo/join r4 r14 into r15;
    call credits.aleo/join r5 r15 into r16;
    call credits.aleo/join r6 r16 into r17;
    call credits.aleo/join r7 r17 into r18;
    call credits.aleo/join r8 r18 into r19;
    call credits.aleo/join r9 r19 into r20;
    call credits.aleo/transfer_private r20 r10 r11 into r21 r22;
    output r21 as credits.aleo/credits.record;
    output r22 as credits.aleo/credits.record;

constructor:
    assert.eq edition 0u16;
