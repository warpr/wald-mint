/**
 *   This file is part of  wald:mint - A library for minting identifiers.
 *   Copyright (C) 2016  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.1.  See copyleft-next-0.3.1.txt.
 */

'use strict';

(function (factory) {
    const imports = [
        'require',
        'chai',
        'hex2dec',
        'jsverify',
        'redis',
        'when',
        'when/node',
        'zbase32',
        '../lib/mint'
    ];

    if (typeof define === 'function' && define.amd) {
        define (imports, factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory (require);
    } else {
        console.log ('Module system not recognized, please use AMD or CommonJS');
    }
} (function (require) {
    const assert = require ('chai').assert;
    const hex2dec = require ('hex2dec');
    const jsverify = require ('jsverify');
    const mint = require ('../lib/mint');
    const nodefn = require ('when/node');
    const redis = require ('redis');
    const when = require ('when');
    const zbase32 = require ('zbase32');

    function redisConnection () {
        const client = redis.createClient ('redis://redis', {
            prefix: 'https://test.waldmeta.org/mint/',
            string_numbers: true,
        });
        client.on ('error', (err) => console.log ('ERROR: ', err));

        return client;
    }

    suite ('prerequisites', function () {
        test ('redis', function (done) {
            const client = redisConnection ();

            const getValue = nodefn.lift (client.get.bind (client));

            client.set ('redisTest', 23);

            getValue ('redisTest')
                .then (reply => assert.strictEqual ('23', reply))
                .then (_ => when (client.incr ('redisTest')))
                .then (_ => getValue ('redisTest'))
                .then (reply => assert.strictEqual ('24', reply))
                .then (_ => when (client.incr ('redisTest')))
                .then (_ => getValue ('redisTest'))
                .then (reply => assert.strictEqual ('25', reply))
                .then (done);
        });
    });

    suite ('wald:mint', function () {
        test ('hex string to ArrayBuffer', function () {
            assert.deepEqual (
                new Uint8Array ([0xCA, 0x55, 0xE7, 0x7E, 0x00, 0xDE, 0xCA, 0xDE]),
                mint.hexStringToArrayBuffer ('0xCA55E77E00DECADE')
            );

            assert.deepEqual (
                new Uint8Array ([0xCA, 0x55, 0xE7, 0x7E, 0x00, 0xDE, 0xCA, 0xDE]),
                mint.hexStringToArrayBuffer ('0xca55e77e00decade')
            );

            assert.deepEqual (
                new Uint8Array ([0xCA, 0x55, 0xE7, 0x7E, 0x00, 0xDE, 0xCA, 0xDE]),
                mint.hexStringToArrayBuffer ('CA55E77E00DECADE')
            );

            assert.deepEqual (
                new Uint8Array ([0xDE, 0xCA, 0xDE]),
                mint.hexStringToArrayBuffer ('0x0000000000DECADE')
            );

            assert.deepEqual (
                new Uint8Array ([0x00]),
                mint.hexStringToArrayBuffer ('0x0000000000')
            );
        });

        test ('decimal string to zbase32', function () {
            assert.equal ('cwix8xayp71s6', zbase32.encode (
                mint.hexStringToArrayBuffer (hex2dec.decToHex ('14579813897048345310'))
            ));

            const decoded = zbase32.decode ('cwix8xayp71s6');

            assert.deepEqual (
                new Uint8Array ([0xCA, 0x55, 0xE7, 0x7E, 0x00, 0xDE, 0xCA, 0xDE]),
                decoded
            );

            const hexStr = mint.hexStringFromArrayBuffer (decoded);
            assert.equal ('0xca55e77e00decade', hexStr);
            assert.equal ('14579813897048345310', hex2dec.hexToDec (hexStr));
        });

        test ('decimal string to zbase32 roundtrip', function () {
            const roundtrip = jsverify.forall ('nat', (testInteger) => {
                const encoded = zbase32.encode (
                    mint.decStringToArrayBuffer (testInteger.toString (10))
                );

                const decoded = mint.decStringFromArrayBuffer (zbase32.decode (encoded));

                return testInteger.toString (10) === decoded;
            });

            jsverify.assert (roundtrip);
        });

        test ('minter', function (done) {
            const client = redisConnection ();

            const cfg = {
                baseUrl: 'https://test.waldmeta.org/mint/',
                shortUrl: 'https://t.waldmeta.org/',
                entities: {
                    artist: 'ar',
                    song: 'so',
                }
            };

            client.set ('artist', 0);
            client.set ('song', 0);

            const minter = mint.factory (cfg);

            minter.newId ('artist')
             .then (id => assert.equal (1, id))
             .then (done);
        });
    });
}));

// -*- mode: javascript-mode -*-
