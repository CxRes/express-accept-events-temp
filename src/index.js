/*!
 *  Copyright (c) 2024, Rahul Gupta
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  SPDX-License-Identifier: MPL-2.0
 */
import { useTry } from "no-try";
import { parseList, Token } from "structured-headers";
import { item } from "structured-field-utils";

import Debug from "debug";
const debug = Debug("accept-events");

/**
 * A Factory function that creates a middleware function to parse the
 * Accept-Events header field.
 * The `config` Object is used to set `urls` and `protocols` supported.
 */
function AcceptEvents({
  // A more sophisticated configuration method will be added in the future
  urls: supportedUrls = () => true, // support notifications on all urls by default
  protocols: supportedProtocols = () => true, // allow all protocols by default
} = {}) {
  /**
   *  A middleware function that parses the `Accept-Events` header. It adds an
   *  `acceptEvent` property to the request object.
   */
  return function acceptEvents(req, res, next) {
    // For now, we implement `Accept-Events` only for HEAD and GET request
    if (req.method === "GET" || req.method === "HEAD") {
      // If events are not supported on this URL, Skip!
      const { pathname } = new URL(req.path, "http://example.org");
      if (!supportedUrls(pathname)) {
        debug("Path does not support notifications");
        return next && next();
      }
      // Accept Events response header is set for HEAD or GET responses
      // To be appended by protocol specific middlewares
      res.setHeader("Accept-Events", "");
    }

    // We process `Accept-Events` only for GET requests
    if (req.method === "GET") {
      // Check if Accept-Events header exists in request
      const acceptEventsRawH = req.headers["accept-events"];
      // If no accept-events header exists, Skip!
      if (!acceptEventsRawH) {
        debug("No Accept-Error header specified");
        return next && next();
      }

      // Check if Accept-Events header parses
      const [acceptEventsParseError, acceptEventsH] = useTry(() =>
        parseList(acceptEventsRawH),
      );
      // If the accept-events header fails to parse as a List, Skip!
      if (acceptEventsParseError) {
        debug(acceptEventsParseError.message);
        return next && next();
      }
      if (acceptEventsH.length === 0) {
        debug("No Protocols specified in the Accept Events Header");
        return next && next();
      }

      // Filter only available protocols
      const acceptEvents = acceptEventsH.filter((li) => {
        let protocol;
        if (typeof li[0] === "string") protocol = li[0];
        if (li[0] instanceof Token) protocol = li[0].toString();
        return protocol && supportedProtocols(protocol, req.path);
      });
      if (acceptEvents.length === 0) {
        debug(
          "Notification Protocol specified are not supported on this route",
        );
        return next && next();
      }

      // Reorder by `q` and parameter count
      req.acceptEvents = item.sort(acceptEvents);
    }

    return next && next();
  };
}

export default AcceptEvents;
