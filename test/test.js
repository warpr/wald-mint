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
        'redis',
        'when',
        'when/node',
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
    const redis = require ('redis');
    const nodefn = require ('when/node');
    const when = require ('when');

    suite ('prerequisites', function () {
        test ('redis', function (done) {
            const client = redis.createClient ({
                prefix: 'https://test.waldmeta.org/mint/',
                string_numbers: true,
            });
            client.on ('error', (err) => console.log ('ERROR: ', err));

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
}));

// -*- mode: javascript-mode -*-
