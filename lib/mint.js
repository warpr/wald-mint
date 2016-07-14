/**
 *   This file is part of wald:find - a library for querying RDF.
 *   Copyright (C) 2016  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.1.  See copyleft-next-0.3.1.txt.
 */

'use strict';

(function (factory) {
    const imports = [
        'require',
        'redis',
        'hex2dec',
        'zbase32',
    ];

    if (typeof define === 'function' && define.amd) {
        define (imports, factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory (require);
    } else {
        console.log ('Module system not recognized, please use AMD or CommonJS');
    }
} (function (require) {
    const redis = require ('redis');
    const nodefn = require ('when/node');
    const when = require ('when');
    const zbase32 = require ('zbase32');
    const hex2dec = require ('hex2dec');

	function hexStringToArrayBuffer (hex) {
        if (hex.substr (0, 2).toLowerCase () === '0x') {
            hex = hex.substr (2);
        }

        const bytes = [];
		for (let i = 0; i < hex.length; i += 2) {
            const byte = parseInt (hex.substr (i, 2), 16);
            if (bytes.length || byte) {
			    bytes.push (byte);
            }
        }

        if (bytes.length === 0) {
            bytes.push (0x00);
        }
		return new Uint8Array (bytes);
    };

    function hexStringFromArrayBuffer (arrayBuffer) {
        const bytes = new Uint8Array (arrayBuffer);
        let ret = '0x';
        for (let i = 0; i < bytes.length; i++) {
            ret += ("00" + bytes[i].toString(16)).substr (-2);
        }
        return ret;
    }

    function decStringToArrayBuffer (dec) {
        let hex = hex2dec.decToHex (dec);
        if (!hex) {
            hex = "0x00";
        }
        return hexStringToArrayBuffer (hex);
    }

    function decStringFromArrayBuffer (arrayBuffer) {
        let dec = hex2dec.hexToDec (hexStringFromArrayBuffer (arrayBuffer));
        return dec === '' ? '0' : dec;
    }

    /*
    * config should be an object describing all entities for which identifiers can
    * be minted, and a few global settings, e.g.:
    *
    * {
    *     baseUrl: 'https://example.org/',
    *     shortUrl: 'https://mus.ic/',
    *     entities: {
    *         artist: "ar",
    *         song: "so",
    *     }
    * }
    *
    */

    class Minter {
        constructor (config) {
            this._config = config;
            this._client = redis.createClient ('redis://redis', {
                prefix: config.baseUrl,
                string_numbers: true,
            });
            this._client.on ('error', (err) => console.log ('ERROR: ', err));
            this.incr = nodefn.lift (this._client.incr.bind (this._client))
        }
        newId (entity) {
            const integer = this.incr (entity);

            return integer;
        }
    }

    return {
        decStringFromArrayBuffer: decStringFromArrayBuffer,
        decStringToArrayBuffer: decStringToArrayBuffer,
        factory: cfg => new Minter (cfg),
        hexStringFromArrayBuffer: hexStringFromArrayBuffer,
        hexStringToArrayBuffer: hexStringToArrayBuffer,
        Minter: Minter,
    };
}));

// -*- mode: javascript-mode -*-
