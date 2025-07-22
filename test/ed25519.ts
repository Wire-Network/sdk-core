// test/ed25519.spec.ts
import { assert } from 'chai';
import nacl from 'tweetnacl';
import { ethers } from 'ethers';

import {
    Bytes,
    Checksum256,
    Crypto,
    KeyType,
    Name,
    PackedTransaction,
    padEdForTx,
    PrivateKey,
    PublicKey,
    Signature,
    SignedTransaction,
    stripEdPad,
    Transaction,
    TransactionExtensionType
} from '$lib';

// --------------------------------------------------------------------------
// ED25519 test suite
// --------------------------------------------------------------------------
suite('ed25519', () => {
    // deterministic seed & keypair for repeatable tests
    const seed = Uint8Array.from(Array(32).fill(0).map((_, i) => i + 1));
    const kp = nacl.sign.keyPair.fromSeed(seed);
    const sk = kp.secretKey;      // 64 bytes
    const pk32 = kp.publicKey;    // 32 bytes
    const pub = PublicKey.from({ type: KeyType.ED, compressed: pk32 });

    test('KeyType index for ED is 4', () => {
        assert.equal(KeyType.indexFor(KeyType.ED), 4);
    });

    // ----------------------------------------------------------------------
    // Interop & basic sign/verify with SDK classes
    // ----------------------------------------------------------------------
    test('key from seed', () => {
        const sdkSk = new PrivateKey(KeyType.ED, Bytes.from(sk));
        const sdkPk = sdkSk.toPublic();
        assert.equal(sdkPk.type, KeyType.ED);
        assert.deepEqual(sdkPk.data.array, pk32);
    });

    test('sign & verify', () => {
        const msg = Bytes.from('hello tweetnacl', 'utf8');
        const sdkSk = new PrivateKey(KeyType.ED, Bytes.from(sk));
        const sdkPk = sdkSk.toPublic();

        const sigObj = sdkSk.signMessage(msg);                   // Signature (64B)
        const expected = nacl.sign.detached(msg.array, sk);      // 64B Uint8Array

        assert.deepEqual(sigObj.data.array, expected);
        assert.isTrue(sigObj.verifyMessage(msg, sdkPk));
        assert.isFalse(sigObj.verifyMessage(Bytes.from('tampered', 'utf8'), sdkPk));
    });

    test('verify using SignatureParts -> Signature.from()', () => {
        const msg = Bytes.from('verify me', 'utf8');
        const det = nacl.sign.detached(msg.array, sk);

        const sigParts = {
            type: KeyType.ED,
            r: det.slice(0, 32),
            s: det.slice(32, 64),
            recid: 0,
        };
        const sig = Signature.from(sigParts);
        assert.isTrue(sig.verifyMessage(msg, pub));
    });

    // ----------------------------------------------------------------------
    // Createlink digest flow
    // ----------------------------------------------------------------------
    test('createlink digest mapping & verification', () => {
        const username = Name.from('daniel');
        const chain = Name.from('solana');
        const nonce = 1234567890000;

        const msg = buildCreateLinkMessage(pub, username, chain, nonce);
        const digestBytes = printableSha256(msg);

        const sigParts = Crypto.sign(sk, digestBytes, KeyType.ED);
        const sig = Signature.from(sigParts);

        const sigStr = sig.toString();
        const parsed = Signature.from(sigStr);
        assert.isTrue(sig.equals(parsed));
        assert.isTrue(sig.verifyMessage(digestBytes, pub));
    });

    // ----------------------------------------------------------------------
    // Transaction flow: padding only when packing
    // ----------------------------------------------------------------------
    test('transaction signingDigest (ED) returns utf8(hex) bytes', () => {
        const tx = Transaction.from({
            expiration: '1970-01-01T00:00:00',
            ref_block_num: 0,
            ref_block_prefix: 0,
            actions: [{
                account: 'testacct',
                name: 'noop',
                authorization: [],
                data: '',
            }],
        });

        const chainId = Checksum256.abiDefault();
        const { msgDigest, msgBytes } = tx.signingDigest(chainId, KeyType.ED);

        const hex = msgDigest.hexString;
        const expected = new TextEncoder().encode(hex);
        assert.deepEqual(msgBytes, expected);
    });

    test('tx.extPubKey adds extension 0x8000 with tag 4 + 32B key', () => {
        const tx = Transaction.from({
            expiration: 0,
            ref_block_num: 0,
            ref_block_prefix: 0,
            actions: [],
        });

        tx.extPubKey(pub);

        assert.equal(tx.transaction_extensions.length, 1);
        const ext = tx.transaction_extensions[0];
        assert.equal(Number(ext.type), TransactionExtensionType.PubKey);
        assert.equal(ext.data.array[0], KeyType.indexFor(KeyType.ED));
        assert.equal(ext.data.array.length, 1 + 32);
    });

    test('PackedTransaction.fromSigned pads ED sig to 65B', () => {
        const tx = Transaction.from({
            expiration: 0,
            ref_block_num: 0,
            ref_block_prefix: 0,
            actions: [{
                account: 'testacct',
                name: 'noop',
                authorization: [],
                data: '',
            }],
        });

        tx.extPubKey(pub);

        const { msgBytes } = tx.signingDigest(Checksum256.abiDefault(), KeyType.ED);
        const sigBytes = nacl.sign.detached(msgBytes, sk);
        const sig = Signature.fromRaw(sigBytes, KeyType.ED); // 64B

        assert.equal(sig.data.array.length, 64);

        const stx = SignedTransaction.from({ ...tx, signatures: [sig] });

        const packed = PackedTransaction.fromSigned(stx, 0 /* no compression */);
        assert.equal(packed.signatures[0].data.array.length, 65, 'padded to 65');

        // padding helper idempotency
        const paddedAgain = padEdForTx(packed.signatures[0]);
        assert.equal(paddedAgain.data.array.length, 65);
        assert.deepEqual(paddedAgain.data.array, packed.signatures[0].data.array);
    });

    // ----------------------------------------------------------------------
    // Serialization round-trips
    // ----------------------------------------------------------------------
    test('Signature.toString() <-> Signature.from() for ED', () => {
        const msg = Bytes.from('roundtrip', 'utf8');
        const det = nacl.sign.detached(msg.array, sk);
        const sig = Signature.fromRaw(det, KeyType.ED);
        const str = sig.toString();
        assert.isTrue(sig.equals(Signature.from(str)));
    });

    test('Signature.fromRaw length checks (ED)', () => {
        assert.throws(() => Signature.fromRaw(new Uint8Array(63), KeyType.ED));
        assert.throws(() => Signature.fromRaw(new Uint8Array(66), KeyType.ED));
    });

    test('Signature.toHex() / fromHex() (ED)', () => {
        const det = new Uint8Array(64).fill(7);
        const sig = Signature.fromRaw(det, KeyType.ED);
        const hex = sig.toHex();            // 0x + 128 hex chars
        const parsed = Signature.fromHex(hex, KeyType.ED);
        assert.isTrue(parsed.equals(sig));
    });

    // ----------------------------------------------------------------------
    // Mixed curve sanity
    // ----------------------------------------------------------------------
    test('padEdForTx leaves non-ED curves untouched', () => {
        const fake = new Uint8Array(65).fill(9);
        fake[0] = 31; // vWire in [31..34]
        const k1Sig = Signature.fromRaw(fake, KeyType.K1);
        const out = padEdForTx(k1Sig);
        assert.equal(out, k1Sig);
    });

    test('sign() returns correct parts for ED', () => {
        const payload = Bytes.from('ed test', 'utf8').array;
        const parts = Crypto.sign(sk, payload, KeyType.ED);
        assert.equal(parts.type, KeyType.ED);
        assert.equal(parts.r.length, 32);
        assert.equal(parts.s.length, 32);

        const sig = Signature.from(parts);
        assert.isTrue(sig.verifyMessage(payload, pub));
    });
    // ----------------------------------------------------------------------
    // Negative / malformed & small extra edges
    // ----------------------------------------------------------------------
    test('Base58 round trip rejects wrong ED payload length', () => {
        const bad = 'SIG_ED_111111111111111111'; // too short
        assert.throws(() => Signature.from(bad));
    });

    test('recover() throws for ED', () => {
        const det = nacl.sign.detached(Bytes.from('x', 'utf8').array, sk);
        const sig = Signature.fromRaw(det, KeyType.ED);
        assert.throws(() => sig.recoverMessage(Bytes.from('x', 'utf8')), /ED25519 does not support public key recovery/i);
    });

    test('stripEdPad ignores non-zero tail byte', () => {
        const raw = new Uint8Array(65).fill(1);
        raw[64] = 7; // not padding
        const sig = new Signature(KeyType.ED, Bytes.from(raw));
        assert.strictEqual(stripEdPad(sig), sig);
    });

    test('PublicKey.toString()/from for ED keeps 32 bytes', () => {
        const s = pub.toString();
        const back = PublicKey.from(s);
        assert.equal(back.data.array.length, 32);
        assert.isTrue(back.equals(pub));
    });
});

// ----------------- helpers -----------------
function printableSha256(msg: string): Uint8Array {
    // mirror contract logic: sha256 → map bytes to [33..126]
    const digest = Checksum256.hash(Bytes.from(msg, 'utf8')).array;
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) out[i] = (digest[i] % 94) + 33;
    return out;
}

function buildCreateLinkMessage(pub: PublicKey, username: Name, chain: Name, nonce: number) {
    return `${pub.toString()}|${username.toString()}|${chain.toString()}|${nonce}|createlink auth`;
}