/**
 * Cancelable promises
 *
 * https://stackoverflow.com/questions/46461801/possible-to-add-a-cancel-method-to-promise-in-typescript/46464377#46464377
 */

export class Canceled extends Error {
    silent = false
    constructor(reason, silent = false) {
        super(reason)
        this.silent = silent
        Object.setPrototypeOf(this, Canceled.prototype)
    }
}

export interface Cancelable<T> extends Promise<T> {
    cancel(reason?: string, silent?: boolean): Cancelable<T>
}

export function cancelable<T>(
    promise: Promise<T>,
    onCancel?: (canceled: Canceled) => void
): Cancelable<T> {
    let cancel: ((reason: string, silent: boolean) => Cancelable<T>) | null = null
    const cancelable: Cancelable<T> = <Cancelable<T>>new Promise((resolve, reject) => {
        cancel = (reason = '', silent = false) => {
            try {
                if (onCancel) {
                    onCancel(new Canceled(reason, silent))
                }
            } catch (e) {
                reject(e)
            }
            return cancelable
        }
        promise.then(resolve, reject)
    })
    if (cancel) {
        cancelable.cancel = cancel
    }
    return cancelable
}
