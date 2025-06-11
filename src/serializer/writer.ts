/** A tiny writer to do EOSIO packing exactly like eosjs.SerialBuffer */
export class ManualWriter {
    private buf: number[] = [];
    writeUint32(v: number) {
        for (let i = 0; i < 4; i++) this.buf.push((v >>> (i * 8)) & 0xff);
    }
    writeUint64(v: number) {
        // Handle as two 32-bit parts for compatibility without BigInt
        const low = v >>> 0;
        const high = Math.floor(v / 0x100000000) >>> 0;
        
        // Write low 32 bits
        for (let i = 0; i < 4; i++) this.buf.push((low >>> (i * 8)) & 0xff);
        // Write high 32 bits
        for (let i = 0; i < 4; i++) this.buf.push((high >>> (i * 8)) & 0xff);
    }
    writeUint16(v: number) {
        this.buf.push(v & 0xff, (v >>> 8) & 0xff);
    }
    writeVarUint32(v: number) {
        while (v >= 0x80) {
            this.buf.push((v & 0x7f) | 0x80);
            v >>>= 7;
        }

        this.buf.push(v);
    }
    writeBytes(data: Uint8Array) {
        for (const b of data) this.buf.push(b);
    }
    toUint8Array(): Uint8Array {
        return Uint8Array.from(this.buf);
    }
}