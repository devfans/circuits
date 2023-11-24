pragma circom 2.0.0;

include "sha256.circom";

template play() {
    // hash(hash(a) + hash(b)) = c
    signal input a[256]; // private
    signal input b[256]; // public
    signal output out[256];

    component sha256_1 = Sha256(256);
    component sha256_2 = Sha256(256);
    component sha256 = Sha256(512);

    sha256_1.in <== a;
    sha256_2.in <== b;

    var i;
    for (i=0; i<256; i++) {
        sha256.in[i] <== sha256_1.out[i];
    }
    for (i=0; i<256; i++) {
        sha256.in[256 + i] <== sha256_2.out[i];
    }

    out <== sha256.out;
}

component main { public [b] } = play();