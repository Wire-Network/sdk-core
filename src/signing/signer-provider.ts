import { ethers } from "ethers";
import { KeyType, PrivateKey, PublicKey } from "../chain";
import { getCurve } from "../crypto";

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
 * Create a classic signer provider using elliptic curves.
 * @param secret The private key as a Uint8Array.
 * @param keyType The type of key (default is K1).
 * @returns A SignerProvider for classic elliptic curve signing.
 */
export const createClassicSigner = (secret: Uint8Array, keyType = KeyType.K1): SignerProvider => {
    const ecKey = getCurve(keyType).keyFromPrivate(secret);
    const privKey = PrivateKey.fromElliptic(ecKey, keyType);

    return {
        pubKey: privKey.toPublic(),
        async sign(msg) {
            const sigBytes = privKey.signMessage(msg).data.array
            return sigBytes;
        }
    };
}

/** @Internal */
interface SupportedAdapters { // Placeholder for solana adapter type
    signMessage: (msg: Uint8Array) => Promise<Uint8Array>;
}