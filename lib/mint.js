/**
 *   This file is part of wald:find - a library for querying RDF.
 *   Copyright (C) 2016  Kuno Woudt <kuno@frob.nl>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of copyleft-next 0.3.1.  See copyleft-next-0.3.1.txt.
 */

'use strict';

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define (['require', './namespace', './query', './tools'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory (require);
    } else {
        console.log ('Module system not recognized, please use AMD or CommonJS');
    }
} (function (require) {
    const namespace = require ('./namespace');
    const query = require ('./query');
    const tools = require ('./tools');

    function firstValues (obj) {
        var ret = {};
        for (var p in obj) {
            if (obj.hasOwnProperty (p) && obj[p].length > 0) {
                ret[p] = obj[p][0];
            } else {
                ret[p] = obj[p];
            }
        }

        return ret;
    }

    return {
        a: namespace.namespaces.rdf.type,
        factory: query.factory,
        firstValues: firstValues,
        loadPrefixes: namespace.loadPrefixes,
        namespaces: namespace.namespaces,
        prefix: namespace.prefix,
        qname: namespace.qname,
        Query: query.Query,
        shortenKeys: namespace.shortenKeys,
        tools: tools,
    };
}));
