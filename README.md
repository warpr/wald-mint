
wald:mint - A library for minting identifiers
=============================================

wald:mint is used to generate
[URIs](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier) for entities and unique
[blank nodes](https://en.wikipedia.org/wiki/Blank_node) for resources which don't need a
real identifier.

Entities
--------

An entity in wald:meta is a resource for which you need user friendly identifiers.  For
example if you're modeling a music library you might want entities for Artists, Songs,
Albums or Releases, etc..

For each resource you need a friendly name and a short prefix (preferably two letters).  You
also need to decide on a base URI for your site.  The configuration might look like this:

    const cfg = {
        baseUri: "https://example.org/",
        entities: {
            artist: "ar",
            song: "so",
        }
    };

With that configuration, you can start minting identifiers:

    const mint = require ('wald-mint');
    const minter = mint.factory (cfg);

    minter.newId ('song').then (id => console.log (id));

If your song database has a lot of songs, and you're minting a new identifier for the
1000000th song in the database, the result from the newId call will look like:

    {
        seq: '1000000',
        zbase32: soxejyy,
        uri: 'https://example.org/song/soxejyy'
    }


Short URIs
----------

The zbase32 value returned by newId uniquely identifies a resource in your system (assuming
you picked a unique prefix).  One use for this raw identifier (instead of the full uri) is to
create short URIs.  As a convenience newId() will do this for you if you specify a shortUri
in the configuration.  Example:

    const mint = require ('wald-mint');
    const minter = mint.factory ({
        baseUri: "https://example.org/",
        shortUri: "http://mus.ic/",
        entities: { song: "so" }
    };

    minter.newId ('song').then (id => console.log (id.shortUri));
    // id.shortUri => "https://mus.ic/soxejyy"


Blank nodes
-----------

In some systems you don't want to manage blank nodes, and it may be useful to
[skolemize](https://www.w3.org/TR/2014/REC-rdf11-concepts-20140225/#section-skolemization)
them.  wald:mint can generate unique skolemized blank nodes:

    minter.bnode ().then (uri => console.log (id));
    // id.seq   => '1000000'
    // id.bnode => '_:bxejyy'
    // id.uri   => 'https://example.org/.well-known/genid/_bxejyy'


Limitations
-----------

wald:mint currently uses redis to persistenly store the last used identifier for each
entity, and atomically increment those identifiers.  redis is limited to 64-bit signed
integers, so at most 9,223,372,036,854,775,807 identifiers can be generated for each
type of entity (including blank nodes).


License
=======

Copyright 2016  Kuno Woudt <kuno@frob.nl>

This program is free software: you can redistribute it and/or modify
it under the terms of copyleft-next 0.3.1.  See
[copyleft-next-0.3.1.txt](copyleft-next-0.3.1.txt).

