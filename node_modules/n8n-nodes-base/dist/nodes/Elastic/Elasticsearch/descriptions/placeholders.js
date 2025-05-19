"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.document = exports.query = exports.aliases = exports.mappings = exports.indexSettings = void 0;
exports.indexSettings = `{
  "settings": {
    "index": {
      "number_of_shards": 3,
      "number_of_replicas": 2
    }
  }
}`;
exports.mappings = `{
  "mappings": {
    "properties": {
      "field1": { "type": "text" }
    }
  }
}`;
exports.aliases = `{
  "aliases": {
    "alias_1": {},
    "alias_2": {
      "filter": {
        "term": { "user.id": "kimchy" }
      },
      "routing": "shard-1"
    }
  }
}`;
exports.query = `{
  "query": {
    "term": {
      "user.id": "john"
    }
  }
}`;
exports.document = `{
  "timestamp": "2099-05-06T16:21:15.000Z",
  "event": {
    "original": "192.0.2.42 - - [06/May/2099:16:21:15 +0000] \"GET /images/bg.jpg HTTP/1.0\" 200 24736"
  }
}`;
//# sourceMappingURL=placeholders.js.map