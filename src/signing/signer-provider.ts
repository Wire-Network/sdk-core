import { ethers } from "ethers";
import { PrivateKey, PrivateKeyType, PublicKey } from "../chain";
import { hexToArray } from "../utils";

export interface SignerProvider {
    /**
     * Public key of the signer in wire format
     */
    pubKey: PublicKey;

    /**
     * Sign an arbitrary message payload.
     * Returns raw sig bytes as Uint8Array.
     */
    sign(msg: string | Uint8Array): Promise<Uint8Array>;
}

/**
 * Create an Ethereum signer provider.
 * @param signer The ethers.js JsonRpcSigner instance.
 * @param pubKey The public key of the signer.
 * @returns A SignerProvider for Ethereum signing.
 */
export const createEmSigner = (signer: ethers.providers.JsonRpcSigner, pubKey: PublicKey): SignerProvider => {
    return {
        pubKey,
        async sign(msg) {
            const msgBytes = typeof msg === 'string'
                ? ethers.utils.toUtf8Bytes(msg)
                : msg;

            const sigHex = await signer.signMessage(msgBytes);
            const sigBytes = ethers.utils.arrayify(sigHex);
            return sigBytes;
        }
    };
}

/**
 * Create an ED25519 signer provider.
 * @param adapter The Phantom adapter for signing messages.
 * @param pubKey The public key of the signer.
 * @returns A SignerProvider for ED25519 signing.
 */
export const createEdSigner = (adapter: SupportedAdapters, pubKey: PublicKey): SignerProvider => {
    return {
        pubKey,
        async sign(msg) {
            const msgBytes = typeof msg === 'string'
                ? new TextEncoder().encode(msg)
                : msg;

            const sigBytes = await adapter.signMessage(msgBytes);
            return sigBytes;
        }
    };
}

/**
 * Create a classic signer provider for K1/R1-style keys.
 *
 * This signer expects a precomputed 32-byte digest payload (the same digest
 * produced by transaction.signingDigest(...).msgBytes for classic keys) and
 * signs it directly via `signDigest` to avoid double-hashing.
 *
 * The returned bytes are in raw `[r||s||v]` format so callers can pass them
 * into `Signature.fromRaw(...)` without additional conversion.
 *
 * @param privateKey Private key in any supported `PrivateKeyType` representation.
 * @returns A `SignerProvider` for classic elliptic-curve signing.
 */
export const createClassicSigner = (privateKey: PrivateKeyType): SignerProvider => {
    const privKey = PrivateKey.from(privateKey);

    return {
        pubKey: privKey.toPublic(),
        async sign(msg) {
            const digest = typeof msg === 'string' ? hexToArray(msg) : msg;
            const signature = privKey.signDigest(digest);
            return hexToArray(signature.toHex().slice(2));
        }
    };
}

/** @Internal */
interface SupportedAdapters { // Placeholder for solana adapter type
    signMessage: (msg: Uint8Array) => Promise<Uint8Array>;
}
