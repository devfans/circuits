const crypto = require("crypto");

function buffer2bitArray(b) {
    const res = [];
    for (let i=0; i<b.length; i++) {
        for (let j=0; j<8; j++) {
            res.push((b[i] >> (7-j) &1));
        }
    }
    return res;
}

function bitArray2buffer(a) {
    const len = Math.floor((a.length -1 )/8)+1;
    const b = new Buffer.alloc(len);

    for (let i=0; i<a.length; i++) {
        const p = Math.floor(i/8);
        b[p] = b[p] | (Number(a[i]) << ( 7 - (i%8)  ));
    }
    return b;
}

const a = Buffer.from("0cffe17f68954dac3a84fb1458bd5ec99209449749b2b308b7cb55812f9563af", "hex")
const b = Buffer.from("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1", "hex");

const hash_a = crypto.createHash("sha256")
    .update(a)
    .digest("hex");

const hash_b = crypto.createHash("sha256")
    .update(b)
    .digest("hex");

const raw_c = Buffer.from(hash_a + hash_b, "hex")
// hash(hash(a) + hash(b)) = c
const hash_c = crypto.createHash("sha256")
    .update(raw_c)
    .digest("hex");
console.log(hash_a, hash_b, raw_c.toString("hex"), hash_c)

const print = data => {
    console.log(JSON.stringify(buffer2bitArray(data)))
}

print(a)
print(b)
print(Buffer.from(hash_c, "hex"))


/*

compile:
circom play.circom --r1cs --wasm --sym --c -l node_modules/circomlib/circuits/sha256

witness:
pushd play_js
node generate_witness.js play.wasm ../input.json witness.wtns
popd

trusted setup:
snarkjs powersoftau new bn128 18 pot18_0000.ptau -v
snarkjs powersoftau contribute pot18_0000.ptau pot18_0001.ptau --name="First contribution" -v
trusted setup phase 2:
snarkjs powersoftau prepare phase2 pot18_0001.ptau pot18_final.ptau -v

groth16:
snarkjs groth16 setup ../play.r1cs pot18_final.ptau play_0000.zkey
snarkjs zkey contribute play_0000.zkey play_0001.zkey --name="1st Contributor Name" -v
snarkjs zkey export verificationkey play_0001.zkey verification_key.json
snarkjs groth16 prove play_0001.zkey ../play_js/witness.wtns proof.json public.json
snarkjs groth16 verify verification_key.json public.json proof.json
snarkjs zkey export solidityverifier play_0001.zkey verifier.sol
snarkjs generatecall

plonk:
snarkjs plonk setup ../play.r1cs pot19_final.ptau plonk_final.zkey
snarkjs zkey export verificationkey plonk_final.zkey verification_key.json
snarkjs plonk prove plonk_final.zkey ../play_js/witness.wtns proof.json public.json
snarkjs plonk verify verification_key.json public.json proof.json
snarkjs zkey export solidityverifier plonk_final.zkey verifier.sol

fflonk:
snarkjs fflonk setup ../play.r1cs ../plonk/pot19_final.ptau fflonk.zkey
snarkjs zkey export verificationkey fflonk.zkey verification_key.json
snarkjs fflonk prove fflonk.zkey ../play_js/witness.wtns proof.json public.json
snarkjs fflonk verify verification_key.json public.json proof.json
snarkjs zkey export solidityverifier fflonk.zkey verifier.sol


tau:
snarkjs powersoftau new bn128 19 pot19_0000.ptau -v
snarkjs powersoftau contribute pot19_0000.ptau pot19_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot19_0001.ptau pot19_final.ptau -v
snarkjs powersoftau verify pot19_final.ptau



multiplier2: a * b = c
                          groth16      plonk       fflonk
proof.json                804B         2.2K        2.1K
verification_key.json     2.9K         1.7K        1.1K
verifier.sol              7.0K         26K         59K

play_hash:  hash(hash(a)|hash(b)) = c
                          groth16      plonk       fflonk
proof.json                803B         x           x
verification_key.json     94K          x           x
verifier.sol              206K         x           x


G: generator
P: Prover
V: Verifier
C: Program

G(lambda) -> pk, vk
G(C, lambda) -> pk, vk

x: public inputs
w: witnesses
proof = P(pk, x, w)

V(vk, x, proof)


*/
