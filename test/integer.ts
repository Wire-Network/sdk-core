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
    test('from', function () {
        // Converting from number, string, and UInt128 (existing tests)
        assertUint256(UInt256.from(123), '123');
        assertUint256(UInt256.from('123.456'), '123.456');
        assertUint256(UInt256.from(new UInt128(new BN(100))), '100');
        assertUint256(
            UInt256.from('340282366920938463463.374607431768211456'),
            '340282366920938463463.374607431768211456'
        );
        assertUint256(
            UInt256.from('99999999999999999999999999999999999999'),
            '99999999999999999999999999999999999999'
        );

        // Edge cases
        assertUint256(UInt256.from(0), '0');
        assertUint256(UInt256.from('0.000000000000000001'), '0.000000000000000001');

        // —————————————————————————————————————————————————————————————————
        // Tests for the newly added input types:

        // 1) From an existing UInt256 (clone behavior)
        const original = UInt256.from('789.012');
        const cloned = UInt256.from(original);
        // Cloned should produce the same decimal string
        assertUint256(cloned, '789.012');
        // And low/high fields should match
        assert.equal(
            cloned.low.toString(),
            original.low.toString(),
            'Clone.low matches'
        );
        assert.equal(
            cloned.high.toString(),
            original.high.toString(),
            'Clone.high matches'
        );

        // 2) From an ethers.BigNumber → treat as a whole‐integer decimal
        const bigNumberValue = ethers.BigNumber.from('1000');
        const fromBigNumber = UInt256.from(bigNumberValue);
        assertUint256(fromBigNumber, '1000');

        // 3) From a BN (raw integer)
        const bnValue = new BN('2500');
        const fromBN = UInt256.from(bnValue);
        assertUint256(fromBN, '2500');

        // 4) From a { low, high } object:
        //    low = 123, high = 456 → raw = (456 << 128) + 123
        //    But since this branch does not apply any scaling, we check low/high directly
        const parts = { low: 123, high: 456 };
        const fromParts = UInt256.from(parts);
        // low field should be exactly 123
        assert.equal(Number(fromParts.low), 123, 'Parts.low matches');
        // high field should be exactly 456
        assert.equal(Number(fromParts.high), 456, 'Parts.high matches');
        // raw() = (456 << 128) + 123;  toString() should reflect that divided by 10^18
        const rawInteger = new BN(456).shln(128).add(new BN(123));
        // Since toString() prints raw/SCALE, expect a fractional decimal:
        const expectedStr = rawInteger
            .div(new BN(10).pow(new BN(UInt256.DECIMALS)))
            .toString() +
            '.' +
            rawInteger
                .mod(new BN(10).pow(new BN(UInt256.DECIMALS)))
                .toString()
                .padStart(UInt256.DECIMALS, '0')
                .replace(/0+$/, '');
        assert.equal(
            fromParts.toString(),
            expectedStr,
            'toString() for {low, high} branch yields raw/SCALE'
        );
    });

    test('toString', function () {
        const uint256 = UInt256.from('1234567890123456789.987654321');
        assert.equal(uint256.toString(), '1234567890123456789.987654321');

        const largeValue = UInt256.from('99999999999999999999999999999999999999');
        assert.equal(largeValue.toString(), '99999999999999999999999999999999999999');

        const smallValue = UInt256.from('0.000000000000000001');
        assert.equal(smallValue.toString(), '0.000000000000000001');
    });

    test('toNumber', function () {
        // Values within JavaScript number range
        assert.equal(UInt256.from(123).toNumber(), 123);
        assert.equal(UInt256.from('123.456').toNumber(), 123.456);

        // Values outside JS number range
        const largeValue = UInt256.from('99999999999999999999999999999999999999');
        const bigVal = largeValue.toNumber();

        // If it's too large for a safe JS number, your UInt256.toNumber() should return a BN
        if (BN.isBN(bigVal)) {
            // Good: it's too large, so we got a BN
            assert.equal(bigVal.toString(), '99999999999999999999999999999999999999');
        } else {
            throw new Error(
                'Expected a BN for this very large value, but got a JS number: ' + bigVal
            );
        }

        // Fractional part example that still fits in JS float
        const fractionalValue = UInt256.from('0.000000000000000001');
        assert.equal(fractionalValue.toNumber(), 1e-18);
    });

    test('add', function () {
        const a = UInt256.from(123);
        const b = UInt256.from(456);
        assertUint256(a.add(b), '579');

        const largeA = UInt256.from('99999999999999999999999999999999999999');
        const smallB = UInt256.from(1);
        assertUint256(largeA.add(smallB), '100000000000000000000000000000000000000');
    });

    test('subtract', function () {
        const a = UInt256.from(456);
        const b = UInt256.from(123);
        assertUint256(a.subtract(b), '333');

        const largeA = UInt256.from('100000000000000000000000000000000000000');
        const smallB = UInt256.from(1);
        assertUint256(largeA.subtract(smallB), '99999999999999999999999999999999999999');

        // Underflow handling
        const underflowA = UInt256.from(123);
        const underflowB = UInt256.from(456);
        assert.throws(() => underflowA.subtract(underflowB));
    });

    test('multiply', function () {
        const a = UInt256.from(123);
        const b = UInt256.from(456);
        // 123 * 456 = 56088
        assertUint256(a.multiply(b), '56088');

        const largeA = UInt256.from('99999999999999999999');
        const smallB = UInt256.from(2);
        assertUint256(largeA.multiply(smallB), '199999999999999999998');
    });

    test('divide', function () {
        const a = UInt256.from(456);
        const b = UInt256.from(123);
        // With 18-decimal logic, 456 / 123 = 3.707317073170731707
        assertUint256(a.divide(b), '3.707317073170731707');

        const largeA = UInt256.from('100000000000000000000000000000000000000');
        const smallB = UInt256.from(2);
        assertUint256(largeA.divide(smallB), '50000000000000000000000000000000000000');

        // Division by zero
        const zeroB = UInt256.from(0);
        assert.throws(() => a.divide(zeroB), /Division by zero/);
    });

    test('modulo', function () {
        const a = UInt256.from(456);
        const b = UInt256.from(123);
        // 456 % 123 = 87
        // In 18-decimal scale, that remains "87" once we interpret toString()
        assertUint256(a.modulo(b), '87');

        const largeA = UInt256.from('100000000000000000000000000000000000001');
        const smallB = UInt256.from(2);
        assertUint256(largeA.modulo(smallB), '1');
    });

    test('greaterThan', function () {
        const a = UInt256.from(123);
        const b = UInt256.from(456);
        assert.isTrue(b.greaterThan(a));
        assert.isFalse(a.greaterThan(b));
    });

    test('lessThan', function () {
        const a = UInt256.from(123);
        const b = UInt256.from(456);
        assert.isTrue(a.lessThan(b));
        assert.isFalse(b.lessThan(a));
    });

    test('equals', function () {
        const a = UInt256.from(123);
        const b = UInt256.from(123);
        const c = UInt256.from(456);
        assert.isTrue(a.equals(b));
        assert.isFalse(a.equals(c));
    });

    test('edge cases', function () {
        // Attempting to store 2^256 - 1, but multiplied by 1e18 => overflow
        assert.throws(
            () => UInt256.from('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
            /exceeds 256 bits once scaled/
        );

        // Check the largest decimal that still fits < 2^256
        // (2^256 - 1) / 1e18 => ensures no overflow.
        // So we create it via fromRaw in code or a direct BN division
        const maxDecimalBN = UInt256.MAX_UINT256.div(new BN(10).pow(new BN(18)));
        const maxDecimal = UInt256.fromRaw(maxDecimalBN);
        // Just verify we can do toString without error
        assert.isString(maxDecimal.toString(), 'Should produce a valid decimal string');
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