/** Supported Wire curve types. */
export enum KeyType {
    K1 = 'K1', // Secp256k1 - used for EOSIO and other chains
    R1 = 'R1', // Secp256r1 - used for Bitcoin and Ethereum
    WA = 'WA', // Webassembly - used for WASM based chains like Near
    EM = 'EM', // Ethereum Message - handles ethereum signed message prefix
    ED = 'ED'  // Ed25519 - used for Solana and other ED chains
}

export namespace KeyType {
    export function indexFor(value: KeyType) {
        switch (value) {
            case KeyType.K1:
                return 0;
            case KeyType.R1:
                return 1;
            case KeyType.WA:
                return 2;
            case KeyType.EM:
                return 3;
            case KeyType.ED:
                return 4;
            default:
                throw new Error(`Unknown curve type: ${value}`);
        }
    }
    export function from(value: number | string) {
        let index: number;

        if (typeof value !== 'number') {
            index = KeyType.indexFor(value as KeyType);
        } else {
            index = value;
        }

        switch (index) {
            case 0:
                return KeyType.K1;
            case 1:
                return KeyType.R1;
            case 2:
                return KeyType.WA;
            case 3:
                return KeyType.EM;
            case 4:
                return KeyType.ED;
            default:
                throw new Error('Unknown curve type');
        }
    }
}
