import { ethers } from "ethers";
import { KeyType } from "../chain";

export interface SignerProvider {
    readonly keyType: KeyType;

    /**
     * Sign an arbitrary message payload.
     * Returns raw sig bytes as Uint8Array.
     */
    sign(msg: string | Uint8Array): Promise<Uint8Array>;
}

export const createEmSigner = (signer: ethers.providers.JsonRpcSigner): SignerProvider => {
    return {
        keyType: KeyType.EM,
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

export const createEdSigner = (adapter: SupportedAdapters): SignerProvider => {
    return {
        keyType: KeyType.ED,
        async sign(msg) {
            const msgBytes = typeof msg === 'string'
                ? new TextEncoder().encode(msg)
                : msg;

            const sigBytes = await adapter.signMessage(msgBytes);
            return sigBytes;
        }
    };
}

/** @Internal */
interface SupportedAdapters { // Placeholder for solana adapter type
    signMessage: (msg: Uint8Array) => Promise<Uint8Array>;
}