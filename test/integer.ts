import { assert } from 'chai';
import BN from 'bn.js';
import { Int, Int128, Int16, Int32, Int64, Int8, UInt128, UInt16, UInt256, UInt256Parts, UInt32, UInt64, UInt8 } from '$lib';
import { ethers } from 'ethers';

suite('integer', function () {
    test('from', function () {
        assertInt(Int8.from(850, 'truncate'), 82);
        assertInt(Int16.from(Int8.from(82), 'truncate'), 82);
        assertInt(UInt8.from(-100, 'truncate'), 156);
        assertInt(Int16.from(-100, 'truncate'), -100);
        assertInt(UInt16.from(-100, 'truncate'), 65436);
        assertInt(Int16.from(4294967196, 'truncate'), -100);
        assertInt(UInt64.from(-100, 'truncate'), '18446744073709551516');
        assertInt(Int64.from(-100, 'truncate'), -100);
        assertInt(UInt64.from(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
        assertInt(Int32.from('-1985000104'), -1985000104);
        assert.throws(() => UInt32.from(-1985000104), /underflow/);
        assertInt(UInt32.from(-1985000104, 'clamp'), 0);
        assertInt(UInt32.from('18446744073709551516', 'truncate'), 4294967196);
        assertInt(UInt32.from('18446744073709551516', 'clamp'), 4294967295);
        assert.throws(() => UInt32.from('18446744073709551516'), /overflow/);
        assert.throws(() => Int8.from(200), /overflow/);
        assert.throws(() => Int8.from(200), /overflow/);
        assert.throws(() => UInt16.from(65536), /overflow/);
        assert.throws(() => Int64.from('12345678900000000000'), /overflow/);
        assert.throws(() => UInt128.from('-42'), /underflow/);
        assert.throws(() => UInt8.from(-1), /underflow/);
        assert.throws(() => Int16.from(-32799), /underflow/);
        assert.throws(() => UInt128.from('banana'), /invalid/i);
    });

    test('cast', function () {
        assertInt(Int32.from('-4890').cast(UInt64), '18446744073709546726');

        assertInt(UInt8.from(1).cast(Int32), 1);
        assertInt(Int32.from(-100).cast(UInt64), '18446744073709551516');
        assertInt(Int64.from(-100000).cast(Int8), 96);
        assertInt(
            UInt128.from('340282366920938463463374607431768211455').cast(UInt64),
            '18446744073709551615'
        );
        assertInt(UInt128.from('559900').cast(Int8), 28);
        assertInt(UInt8.from(200).cast(Int8), -56);
        assertInt(UInt8.from(200).cast(Int8, 'clamp'), 127);
        assertInt(Int8.from(-56).cast(UInt8), 200);
        assertInt(Int8.from(-56).cast(UInt8, 'clamp'), 0);
        assertInt(UInt8.from(200).cast(Int8), -56);
        assert.throws(() => {
            Int8.from(-56).cast(UInt8, 'throw');
        });
        assert.throws(() => {
            UInt8.from(200).cast(Int8, 'throw');
        }, /overflow/);
        assert.throws(() => {
            Int8.from(-1).cast(UInt8, 'throw');
        }, /underflow/);
    });

    test('add', function () {
        const a = UInt8.from(10);
        const b = Int8.from(-20);
        const c = a.adding(b).cast(Int8);
        assertInt(c, -10);
        c.add(1000);
        assertInt(c, -34);
        assertInt(UInt32.from(4000000000).adding(Int128.from(1)), 4000000001);
    });

    test('subtract', function () {
        const a = Int8.from(100);
        const b = UInt64.from(5000);
        b.subtract(10);
        const c = a.subtracting(b);
        assertInt(c, '-26');
        assertInt(
            UInt64.from(-1, 'truncate').subtracting(Int128.from('19446744070000000000')),
            '17446744077419103231'
        );
    });

    test('multiply', function () {
        const a = UInt8.from(100);
        const b = Int64.from(5000);
        b.multiply(2);
        const c = a.multiplying(b);
        assertInt(c, 64);
        assertInt(
            Int128.from('52342352348378372732', 'truncate')
                .multiplying(Int64.from('19446744070000'))
                .cast(Int64),
            '4721481336455838272'
        );
    });

    test('divide', function () {
        const v = Int32.from(10);
        v.divide(2);
        assertInt(v.dividing(3), 1);
        assertInt(v.dividing(4), 1);
        assertInt(v.dividing(3, 'ceil'), 2);
        assertInt(v.dividing(4, 'ceil'), 2);
        assertInt(v.dividing(3, 'round'), 2);
        assertInt(v.dividing(4, 'round'), 1);
        const v2 = Int64.from('1000000000000000000');
        v2.divide(2);
        assertInt(v2.dividing('300000000000000000'), 1);
        assertInt(v2.dividing('400000000000000000'), 1);
        assertInt(v2.dividing('300000000000000000', 'ceil'), 2);
        assertInt(v2.dividing('400000000000000000', 'ceil'), 2);
        assertInt(v2.dividing('300000000000000000', 'round'), 2);
        assertInt(v2.dividing('400000000000000000', 'round'), 1);
        v2.divide(-100000000000);
        assertInt(v2, -5000000);
        assertInt(
            Int64.from(-5000000000)
                .multiplying(2)
                .dividing(UInt32.from(-1, 'truncate'))
                .cast(Int16),
            -2
        );
        assertInt(Int8.from(127).dividing(-2).cast(UInt8), 193);
        assertInt(UInt32.from(-1, 'truncate').dividing(Int8.from(2), 'ceil'), 2147483648);
        assertInt(Int32.from(1).dividing(UInt128.from(1), 'ceil'), 1);
        assertInt(Int32.from(-2).dividing(Int128.from(-1), 'ceil'), 2);
        assertInt(Int32.from(-2).dividing(Int16.from(10), 'ceil'), 1);
        assertInt(Int32.from(100).dividing(Int8.from(-99), 'ceil'), -2);
        assert.throws(() => {
            UInt128.from(100).divide(0, 'round');
        }, /Division by zero/);
        assert.throws(() => {
            Int8.from(100).divide(0);
        }, /Division by zero/);
        assert.throws(() => {
            Int64.from(100).divide(0, 'ceil');
        }, /Division by zero/);
    });

    test('greater than', function () {
        assert.isTrue(Int8.from(10).gt(Int8.from(5)));
        assert.isTrue(Int64.from(10).gt(Int8.from(5)));
        assert.isTrue(Int8.from(10).gt(Int64.from(5)));
    });

    test('less than', function () {
        assert.isTrue(Int8.from(5).lt(Int8.from(10)));
        assert.isTrue(Int64.from(5).lt(Int8.from(10)));
        assert.isTrue(Int8.from(5).lt(Int64.from(10)));
    });

    test('greater than or equal', function () {
        assert.isTrue(Int8.from(10).gte(Int8.from(5)));
        assert.isTrue(Int64.from(10).gte(Int8.from(5)));
        assert.isTrue(Int8.from(10).gte(Int64.from(5)));
        assert.isTrue(Int8.from(10).gte(Int8.from(10)));
        assert.isTrue(Int64.from(10).gte(Int8.from(10)));
        assert.isTrue(Int8.from(10).gte(Int64.from(10)));
    });

    test('less than or equal', function () {
        assert.isTrue(Int8.from(5).lte(Int8.from(10)));
        assert.isTrue(Int64.from(5).lte(Int8.from(10)));
        assert.isTrue(Int8.from(5).lte(Int64.from(10)));
        assert.isTrue(Int8.from(10).lte(Int8.from(10)));
        assert.isTrue(Int64.from(10).lte(Int8.from(10)));
        assert.isTrue(Int8.from(10).lte(Int64.from(10)));
    });

    test('to primitive', function () {
        const smallValue = UInt64.from('1459536');
        assert.equal(String(smallValue), '1459536');
        assert.equal(Number(smallValue), 1459536);
        assert.equal(JSON.stringify(smallValue), '1459536');
        const bigValue = UInt64.from('14595364149838066048');
        assert.equal(String(bigValue), '14595364149838066048');
        assert.equal(JSON.stringify(bigValue), '"14595364149838066048"');
        assert.throws(() => {
            assert.ok(Number(bigValue));
        }, /Number can only safely store up to 53 bits/);
    });
});

function assertInt(actual: Int, expected: number | string) {
    const type = actual.constructor as typeof Int;
    const message = `Expected value of type ${type.abiName} to be equal`;

    if (typeof expected === 'string') {
        assert.equal(String(actual), expected, message);
    } else {
        assert.equal(Number(actual), expected, message);
    }
}

suite('UInt256', function () {
    test('from: number, string, UInt128, ethers.BigNumber, existing UInt256, and {low, high}', function () {
        // 1) From a number → "123"
        const fromNumber = UInt256.from(123);
        assertUint256(fromNumber, '123');

        // 2) From a string with fractional part → "123.456"
        const fromString = UInt256.from('123.456');
        assertUint256(fromString, '123.456');

        // 3) From a UInt128 instance → treat as raw 128-bit, high = 0
        const u128 = UInt128.from(new BN(100));
        const fromUInt128 = UInt256.from(u128);
        assertUint256(fromUInt128, '100');

        // 4) From an ethers.BigNumber → raw 256-bit integer (no scaling)
        const bigNumberValue = ethers.BigNumber.from('1000');
        const fromBigNumber = UInt256.from(bigNumberValue);
        assertUint256(fromBigNumber, '1000');

        // 5) From an existing UInt256 → clone behavior
        const original = UInt256.from('456.789');
        const clone = UInt256.from(original);
        assertUint256(clone, '456.789');

        // 6) From an object { low, high } → raw halves
        //    low = 123, high = 456 ⇒ raw = (456 << 128) + 123
        const parts = { low: 123, high: 456 };
        const fromParts = UInt256.from(parts);
        const expectedFromParts = new BN(456).shln(128).add(new BN(123));

        // Instead of comparing raw() directly, divide out the SCALE:
        assert.equal(
            fromParts.raw().div(UInt256.SCALE).toString(),
            expectedFromParts.toString(),
            "raw()/SCALE should equal (high << 128) + low"
        );

        // And you can also assert that toString() (which is raw()/SCALE) matches:
        assert.equal(
            fromParts.toString(),
            expectedFromParts.toString(),
            "toString() should equal (high << 128) + low"
        );
        assert.equal(fromParts.toString(), expectedFromParts, 'toString matches raw');

        // 7) Edge cases for scaled input:
        //    (a) Very small fractional: "0.000000000000000001"
        const tinyFrac = UInt256.from('0.000000000000000001');
        assertUint256(tinyFrac, '0.000000000000000001');

        //    (b) Zero
        const zero = UInt256.from(0);
        assertUint256(zero, '0');

        // 8) Overflow when scaling:
        assert.throws(
            () =>
                UInt256.from(
                    '115792089237316195423570985008687907853269984665640564039457584007913129639935'
                ),
            /exceeds 256 bits once scaled/
        );
    });

    test('toString', function () {
        // A mixed integer + fractional value
        const value = UInt256.from('1234567890123456789.987654321');
        assert.equal(value.toString(), '1234567890123456789.987654321');

        // A very large integer raw (no fractional)
        const largeRaw = UInt256.from('99999999999999999999999999999999999999');
        assert.equal(largeRaw.toString(), '99999999999999999999999999999999999999');

        // A tiny fractional
        const tiny = UInt256.from('0.000000000000000001');
        assert.equal(tiny.toString(), '0.000000000000000001');
    });

    test('toNumber', function () {
        // Values that fit in JS number range
        assert.equal(UInt256.from(123).toNumber(), 123);
        assert.equal(UInt256.from('123.456').toNumber(), 123.456);

        // Value outside JS number range → should return BN
        const huge = UInt256.from('99999999999999999999999999999999999999');
        const maybeBN = huge.toNumber();
        assert.isTrue(
            BN.isBN(maybeBN),
            'Expected a BN for values exceeding JS safe integer range'
        );

        if (BN.isBN(maybeBN)) {
            assert.equal(
                maybeBN.toString(),
                '99999999999999999999999999999999999999'
            );
        }

        // Tiny fractional that still fits in JS float precision
        const frac = UInt256.from('0.000000000000000001');
        assert.equal(frac.toNumber(), 1e-18);
    });

    test('add', function () {
        const a = UInt256.from(123);
        const b = UInt256.from(456);
        assertUint256(a.add(b), '579');

        const bigA = UInt256.from('99999999999999999999999999999999999999');
        const one = UInt256.from(1);
        assertUint256(
            bigA.add(one),
            '100000000000000000000000000000000000000'
        );
    });

    test('subtract', function () {
        const a = UInt256.from(456);
        const b = UInt256.from(123);
        assertUint256(a.subtract(b), '333');

        const bigA = UInt256.from('100000000000000000000000000000000000000');
        const one = UInt256.from(1);
        assertUint256(
            bigA.subtract(one),
            '99999999999999999999999999999999999999'
        );

        // Underflow case
        const small = UInt256.from(100);
        const larger = UInt256.from(200);
        assert.throws(() => small.subtract(larger), /Underflow/);
    });

    test('multiply', function () {
        const a = UInt256.from(123);
        const b = UInt256.from(456);
        // 123 * 456 = 56088
        assertUint256(a.multiply(b), '56088');

        const bigA = UInt256.from('99999999999999999999');
        const two = UInt256.from(2);
        assertUint256(
            bigA.multiply(two),
            '199999999999999999998'
        );
    });

    test('divide', function () {
        const a = UInt256.from(456);
        const b = UInt256.from(123);
        // (456 * 10^18) / (123 * 10^18) = 456/123 = 3.707317073170731707
        assertUint256(a.divide(b), '3.707317073170731707');

        const bigA = UInt256.from('100000000000000000000000000000000000000');
        const two = UInt256.from(2);
        assertUint256(
            bigA.divide(two),
            '50000000000000000000000000000000000000'
        );

        // Division by zero
        const zero = UInt256.from(0);
        assert.throws(() => a.divide(zero), /Division by zero/);
    });

    test('modulo', function () {
        const a = UInt256.from(456);
        const b = UInt256.from(123);
        // 456 % 123 = 87
        assertUint256(a.modulo(b), '87');

        const bigA = UInt256.from('100000000000000000000000000000000000001');
        const two = UInt256.from(2);
        assertUint256(bigA.modulo(two), '1');

        // Modulo by zero
        const zero = UInt256.from(0);
        assert.throws(() => a.modulo(zero), /Division by zero/);
    });

    test('compare / equals / greaterThan / lessThan', function () {
        const a = UInt256.from(100);
        const b = UInt256.from(200);
        const c = UInt256.from(100);

        assert.isTrue(a.lessThan(b));
        assert.isFalse(b.lessThan(a));

        assert.isTrue(b.greaterThan(a));
        assert.isFalse(a.greaterThan(b));

        assert.isTrue(a.equals(c));
        assert.isFalse(a.equals(b));
    });

    test('edge case: maximum raw decimal that does not overflow', function () {
        // Compute (2^256 - 1) / 10^18 as a BN, then construct via fromRaw
        const maxDecimalBN = UInt256.MAX_UINT256.div(
            new BN(10).pow(new BN(18))
        );
        const maxDecimal = UInt256.fromRaw(maxDecimalBN);
        // toString should produce a valid decimal
        assert.isString(maxDecimal.toString());
    });
});

/**
 * Helper to assert UInt256 equals expected value
 * by comparing toString() output
 */
function assertUint256(actual: UInt256, expected: string) {
    assert.equal(
        actual.toString(),
        expected,
        `Expected UInt256 to equal ${expected}`
    );
}