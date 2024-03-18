# Express-Accept-Events

A Connect/Express style middleware to parse the `Accept-Events` header field specified in [Per Resource Events](https://cxres.github.io/prep/draft-gupta-httpbis-per-resource-events.html).

## Installation

Install **Express-Accept-Events** using your favourite package manager.

```sh
npm|pnpm|yarn add express-accept-events
```

## Usage

**Express-Accept-Events** provides a factory function to create a middleware to parse the `Accept-Events` header field. The factory can be configured to specify if a a given URL path supports notifications and if a particular notification protocol is supported on a given URL path.

```js
import AcceptEvents from "express-accept-events";

const acceptEvents = AcceptEvents({
  // true if a particular protocol is supported on a route
  protocols(protocol, url) {
    if (url === "/notifications") {
      return protocol === "solid";
    }
    else {
      return protocol === "prep";
    }
  }
  // true if route supports notifications
  urls() {
    // notifications are sent on all paths except those begining with 'static'
    return !urls.startsWith("/static/");
  }
})
```

Now you are ready to invoke the middleware in your server. In case one is using an Express server:

```js
const app = express();

app.use(acceptEvents);
```

The middleware populates `req.acceptEvents` with a list of notification protocols and their corresponding parameters (sorted by the value of a `q` parameter, if provided). For Example, the following HTTP request:

```http
GET /notifications HTTP/1.1
Host: example.com
Accept: text/plain
Accept-Events: "prep"; accept="message/rfc822"; q=0.9, "solid"; type="WebSocket2023"
```

with the GET handler, so specified:

```js
app.get('/foo', (req, res) => {
  console.log(req.acceptEvents);
});
```

will result in the output:

```sh
[
  [ "solid", Map(1) { "type" => "WebSocket2023" } ]
  [ "prep", Map(2) { "accept" => "message/rfc822", "q" => 0.9 } ]
]
```

## Errors

In case the middleware fails to parse the `Accept-Events` header field, the `req.acceptEvents` property is not created.

## Copyright and License

Copyright © 2024, [Rahul Gupta](https://cxres.pages.dev/profile#i)

The source code in this repository is released under the [Mozilla Public License v2.0](./LICENSE).
