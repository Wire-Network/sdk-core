import sodiumWrapper from 'libsodium-wrappers';

let _sodium: typeof sodiumWrapper | null = null;

/**
 * Initialize libsodium. Must be called once before using any crypto functions.
 */
export async function initSodium(): Promise<void> {
    if (!_sodium) {
        await sodiumWrapper.ready;
        _sodium = sodiumWrapper;
    }
}

/**
 * Get the initialized sodium instance synchronously.
 * @throws if initSodium() hasn’t been called first.
 */
export function getSodium(): typeof sodiumWrapper {
    if (!_sodium) {
        throw new Error('libsodium not initialized; call initSodium() first');
    }

    return _sodium;
}