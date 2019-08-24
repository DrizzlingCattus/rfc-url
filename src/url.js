const debug = require('debug')('rfc-url:url');
const {formSelector} = require('./url-core.js');

const SCHEME_TYPE = {
    HTTP: 'http',
    HTTPS: 'https',
    FILE: 'file',
};

const SCHEME_PORT = {
    HTTP: 80,
    HTTPS: 443,
};

const Url = function Url(chunk) {
    const self = this;

    const genericChunks = formSelector.genericUrl(chunk);
    debug('genericUrl is', genericChunks);

    self.scheme = formSelector.scheme(genericChunks.scheme);
    self.isFileURL = SCHEME_TYPE.FILE === self.scheme;

    const schemePartChunks = formSelector.schemePart(genericChunks.schemePart);
    debug('schemePart is', schemePartChunks);

    const loginChunks = formSelector.login(schemePartChunks.login);
    debug('login is', loginChunks);

    self.user = formSelector.user(loginChunks.user);
    self.password = formSelector.password(loginChunks.password);

    const hostportChunks = formSelector.hostport(loginChunks.hostport);
    debug('hostport is', hostportChunks);

    self.host = formSelector.host(hostportChunks.host);
    self.port = formSelector.port(hostportChunks.port);
    self.port = matchPortWithScheme(self.port);

    const urlPathChunks = formSelector.urlPath(schemePartChunks.urlPath);
    debug('urlPath is', urlPathChunks);

    // in RFC 1738, there is no comment for query
    // so it just use sliced chunk, not verified
    self.query = urlPathChunks.query;

    self.pathComponents = urlPathChunks.path.split('/');
    self.pathComponents.unshift('/');
    self.lastPathComponent = self.pathComponents[self.pathComponents.length - 1];

    self.absoluteString = chunk.slice();
    return self;

    /* private */
    function matchPortWithScheme(port, scheme) {
        // default port value is '' and '' - 0 is 0.
        const isNotAssign = (port - 0) === 0;

        if (isNotAssign) {
            if (scheme === SCHEME_TYPE.HTTP) {
                return SCHEME_PORT.HTTP;
            } else if (scheme === SCHEME_TYPE.HTTPS) {
                return SCHEME_PORT.HTTPS;
            } else {
                return null;
            }
        }
        return port - 0;
    }
};

module.exports = {
    Url,
    formPredicator,
    formSelector,
};
