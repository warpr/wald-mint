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
        'hex2dec',
        'redis',
        'urijs',
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
    const zbase32 = require ('zbase32');
    const hex2dec = require ('hex2dec');
    const URI = require ('urijs');

    let redisUri = 'redis://127.0.0.1';
    if (process && process.env && process.env.WALD_MINT_REDIS) {
        redisUri = process.env.WALD_MINT_REDIS;
    }

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
            ret += ('00' + bytes[i].toString (16)).substr (-2);
        }
        return ret;
    }

    function decStringToArrayBuffer (dec) {
        let hex = hex2dec.decToHex (dec);
        if (!hex) {
            hex = '0x00';
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
     *     baseUri: "https://example.org/",
     *     shortUri: "https://mus.ic/",
     *     entities: {
     *         artist: "ar",
     *         song: "so",
     *     }
     * }
     *
     * Given the above config, minting a new artist ID would return something like:
     *
     * {
     *     seq: 2
     *     uri: "https://example.org/artist/aryb"
     *     shortUri: "https://mus.ic/aryb"
     * }
     */
    class Minter {
        constructor (config) {
            config.bnodeBaseUri = new URI (config.baseUri)
                .path ('/.well-known/genid').toString ();
            if (!config.entities.bnode) {
                config.entities.bnode = '_b';
            }

            this._config = config;
            this._client = redis.createClient (redisUri, {
                string_numbers: true,
            });
            this._client.on ('error', (err) => console.log ('ERROR: ', err));
            this.incr = nodefn.lift (this._client.incr.bind (this._client))
        }
        newId (entity) {
            const key = entity === 'bnode'
                ? this._config.bnodeBaseUri
                : this._config.baseUri + entity;
            return this.incr (key).then (integer => {
                const prefix = this._config.entities[entity];
                const str = prefix + zbase32.encode (decStringToArrayBuffer (integer));

                const ret = {
                    seq: integer,
                    uri: key + '/' + str,
                    zbase32: str,
                };

                if (entity === 'bnode') {
                    ret.bnode = '_:' + ret.zbase32.substr (1);
                } else if (this._config.shortUri) {
                    ret.shortUri = this._config.shortUri + str;
                }

                return ret;
            });
        }
        bnode () {
            return this.newId ('bnode');
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
