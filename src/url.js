const debug = require('debug')('rfc-url:url');

const MESSAGE = {
    INVALID_BNF: (part, type) => `${part} is not vaild ${type} BNF form`,
};

const BNF_TYPE = {
    GENERIC_URL: 'genericUrl',
    SCHEME: 'scheme',
    SCHEME_PART: 'schemePart',
    LOGIN: 'login',
    URL_PATH: 'urlPath',
    HOSTPORT: 'hostport',
    HOST: 'host',
    HOST_NAME: 'hostName',
    HOST_NUMBER: 'hostNumber',
    DOMAIN_LABEL: 'domainlabel',
    PORT: 'port',
    USER: 'user',
    PASSWORD: 'password',
};

const formPredicator = {};

// alpha = lowalpha | hialpha
formPredicator.isAlpha = (raw) => {
    if (raw.length !== 1) {
        return false;
    }
    const matched = raw.match(/[a-zA-Z]/g) || [];
    if (matched.length === 1) {
        return true;
    }
    return false;
};

// digit = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"
formPredicator.isDigit = (raw) => {
    if (raw.length !== 1) {
        return false;
    }
    const matched = raw.match(/[0-9]/g) || [];
    if (matched.length === 1) {
        return true;
    }
    return false;
};

// safe = "$" | "-" | "_" | "." | "+"
formPredicator.isSafe = (raw) => {
    if (raw.length !== 1) {
        return false;
    }
    const matched = raw.match(/[$-_.+]/) || [];
    if (matched.length === 1) {
        return true;
    }
    return false;
};

// extra = "!" | "*" | "'" | "(" | ")" | ","
formPredicator.isExtra = (raw) => {
    if (raw.length !== 1) {
        return false;
    }
    const matched = raw.match(/[!*'(),]/g) || [];
    if (matched.length === 1) {
        return true;
    }
    return false;
};

// alphadigit = alpha | digit
formPredicator.isAlphaDigit = (raw) => {
    if (formPredicator.isAlpha(raw) ||
        formPredicator.isDigit(raw)) {
        return true;
    }
    return false;
};

// unreserved = alpha | digit | safe | extra
formPredicator.isUnreserved = (raw) => {
    if (formPredicator.isAlpha(raw) ||
        formPredicator.isDigit(raw) ||
        formPredicator.isSafe(raw) ||
        formPredicator.isExtra(raw)) {
        return true;
    }
    return false;
};

// reserved = ";" | "/" | "?" | ":" | "@" | "&" | "="
formPredicator.isReserved = (raw) => {
    if (raw.length !== 1) {
        return false;
    }
    const matched = raw.match(/[;/?:@&=]/g) || [];
    if (matched.length === 1) {
        return true;
    }
    return false;
};

formPredicator.isXchar = (raw) => {
    if (formPredicator.isUnreserved(raw) ||
        formPredicator.isReserved(raw)) {
        return true;
    }
    return false;
};

formPredicator.isScheme = (raw) => {
    if (raw.length === 0) {
        return false;
    }
    const lowAlphaRegexp = new RegExp(/[a-z]/);
    const digitRegexp = new RegExp(/[0-9]/);
    const etcRegexp = new RegExp(/\+|-|\./);
    const final = `${lowAlphaRegexp.source}|${digitRegexp.source}|${etcRegexp.source}`;
    const matched = raw.match(new RegExp(final, 'g')) || [];
    if (matched.length === raw.length) {
        return true;
    }
    return false;
};

// hostnumber = digits "." digits "." digits "." digits
formPredicator.isHostNumber = (raw) => {
    const digitsList = raw.split('.').filter((v) => v !== '');
    if (digitsList.length !== 4) {
        return false;
    }

    let isHostNumber = true;
    digitsList.map((digits) => {
        if (!formPredicator.isDigits(digits)) {
            isHostNumber = false;
        }
    });
    return isHostNumber;
};



// domainlabel= alphadigit | alphadigit *[ alphadigit | "-" ] alphadigit
formPredicator.isDomainlabel = (raw) => {
    if (raw.length < 2) {
        return formPredicator.isAlphaDigit(raw);
    }
    let isDomainlabel = true;
    const endIndex = raw.length - 1;
    Array.from(raw).map((char, i) => {
        const isAlphaDigit = formPredicator.isAlphaDigit(char);
        if (!isAlphaDigit &&
            (i === 0 || i === endIndex)) {
            isDomainlabel = false;
        } else if(!isAlphaDigit && char !== '-') {
            isDomainlabel = false;
        }
    });
    return isDomainlabel;
};

// toplabel = alpha | alpha *[ alphadigit | "-" ] alphadigit
formPredicator.isToplabel = (raw) => {
    if (raw.length < 2) {
        return formPredicator.isAlpha(raw);
    }
    let isToplabel = true;
    const endIndex = raw.length - 1;
    Array.from(raw).map((char, i) => {
        const isAlpha = formPredicator.isAlpha(char);
        const isAlphaDigit = formPredicator.isAlphaDigit(char);
        if ((i === 0 && !isAlpha) ||
            (i === endIndex && !isAlphaDigit)) {
            isToplabel = false;
        } else if (char !== '-' &&
            !isAlphaDigit &&
            !isAlpha) {
            isToplabel = false;
        }
    });
    return isToplabel;
};

// hostname = *[ domainlabel "." ] toplabel
formPredicator.isHostName = (raw) => {
    const toplabelStart = raw.lastIndexOf('.');
    let domainlabels = '';
    if (toplabelStart !== -1) {
        domainlabels = raw.slice(0, toplabelStart).split('.');
        domainlabels.map((domainlabel) => {
            if (!formPredicator.isDomainlabel(domainlabel)) {
                return false;
            }
        });
    } else if (toplabelStart === 0) {
        return false;
    }
    // else left must be toplabel
    return formPredicator.isToplabel(raw.slice(toplabelStart + 1));
};

formPredicator.isXchars = (raw) => {
    const chars = Array.from(raw);
    let isXchars = true;
    chars.map((char) => {
        if (!formPredicator.isXchar(char)) {
            isXchars = false;
        }
    });
    return isXchars;
};

formPredicator.isDigits = (raw) => {
    const chars = Array.from(raw);
    let isDigits = true;
    chars.map((char) => {
        if (!formPredicator.isDigit(char)) {
            isDigits = false;
        }
    });
    return isDigits;
};

formPredicator.isUchar = (raw) => {
    if (formPredicator.isUnreserved(raw)) {
        return true;
    }
    return false;
};

formPredicator.isUchars = (raw) => {
    Array.from(raw).map((char) => {
        if (!formPredicator.isUchar(char)) {
            return false;
        }
    });
    return true;
};
// user = *[ uchar | ";" | "?" | "&" | "=" ]
// password = *[ uchar | ";" | "?" | "&" | "=" ]
formPredicator.isUser = (raw) => {
    Array.from(raw).map((char) => {
        if (!formPredicator.isUchar(char) &&
            char !== ';' &&
            char !== '?' &&
            char !== '&' &&
            char !== '=') {
            return false;
        }
    });
    return true;
};

formPredicator.isPassword = (raw) => {
    return formPredicator.isUser(raw);
};

const formSelector = {};

// genericurl = scheme ":" schemepart
formSelector.genericUrl = (chunk) => {
    //TODO:: check chunck is string
    const delimeterIndex = chunk.indexOf(':');
    const scheme = chunk.slice(0, delimeterIndex);
    const schemePart = chunk.slice(delimeterIndex + 1);
    return { scheme, schemePart };
};

formSelector.scheme = (fromScheme) => {
    if (formPredicator.isScheme(fromScheme)) {
        return fromScheme;
    } else {
        throw Error(MESSAGE.INVALID_BNF(
            fromScheme,
            BNF_TYPE.SCHEME,
        ));
    }
};

// schemepart = *xchar | ip-schemepart
formSelector.schemePart = (fromSchemePart) => {
    let xchars = null;
    if (formPredicator.isXchars(fromSchemePart)) {
        xchars = { xchars: fromSchemePart };
    }
    const loginWithUrlPath = fromSchemePart.split("//").filter((v) => v !== '');
    // ["login/urlpath"]
    if (loginWithUrlPath.length !== 1) {
        // there is more double slash, so it can be xchars
        if (xchars) {
            return xchars;
        }
        throw Error(MESSAGE.INVALID_BNF(
            fromSchemePart,
            BNF_TYPE.SCHEME_PART,
        ));
    }
    let urlPathStart = loginWithUrlPath[0].indexOf('/');
    if (urlPathStart === -1) {
        urlPathStart = loginWithUrlPath[0].length;
    }
    // ["login/urlpath"] => "login"
    const login = loginWithUrlPath[0].slice(0, urlPathStart);
    // ["login/urlpath"] => "urlpath"
    const urlPath = loginWithUrlPath[0].slice(urlPathStart + 1);
    return { login, urlPath };
};

formSelector.login = (fromLogin) => {
    // [ user_with_password?, hostport ]
    const goolbangIndex = fromLogin.indexOf('@');
    const userPasswordWithHostport = fromLogin.split('@');

    // '@hostport' is invaild. [user [: password] @] hostport is spec.
    if (userPasswordWithHostport.length > 2 ||
        goolbangIndex === 0) {
        throw new Error(MESSAGE.INVALID_BNF(
            fromLogin,
            BNF_TYPE.LOGIN,
        ));
    }

    let user = '',
        password = '',
        hostport = '';
    if (userPasswordWithHostport.length === 2) {
        const uAndP = userPasswordWithHostport[0];
        const passwordStart = uAndP.indexOf(':');

        // just user
        if (passwordStart === -1) {
            user = uAndP;
            // 'user:' is invaild, cuz : must use with password.
            // ':password' is invaild, cuz : cannot exist without user
            // [ user [ : password ] ] is RFC spec
        } else if (passwordStart === uAndP.length - 1 ||
            passwordStart === 0) {
            throw new Error(MESSAGE.INVALID_BNF(
                uAnd,
                BNF_TYPE.LOGIN,
            ));
        }
        user = uAndP.slice(0, passwordStart);
        password = uAndP.slice(passwordStart + 1);
        hostport = userPasswordWithHostport[1];
    } else if (userPasswordWithHostport.length === 1) {
        hostport = userPasswordWithHostport[0];
    }
    return {
        user,
        password,
        hostport,
    };
};

// hostport = host [ ":" port ]
formSelector.hostport = (fromHostport) => {
    const portStart = fromHostport.indexOf(':');
    const hostWithPort = fromHostport.split(':');
    if (hostWithPort.length > 2 ||
        portStart === 0) {
        throw new Error(MESSAGE.INVALID_BNF(
            fromHostport,
            BNF_TYPE.HOSTPORT,
        ));
    }
    let host = '',
        port = '';
    if (hostWithPort.length === 1) {
        host = hostWithPort[0];
    } else if(hostWithPort.length === 2) {
        host = hostWithPort[0];
        port = hostWithPort[1];
    }
    return {
        host,
        port,
    };
};

// host = hostname | hostnumber
// hostname = *[ domainlabel "." ] toplabel
// hostnumber = digits "." digits "." digits "." digits
formSelector.host = (fromHost) => {
    const isHostName = formPredicator.isHostName(fromHost),
        isHostNumber = formPredicator.isHostNumber(fromHost);
    if (isHostName || isHostNumber) {
        return fromHost;
    } else {
        throw new Error(MESSAGE.INVALID_BNF(
            fromHost,
            BNF_TYPE.HOST,
        ));
    }
};

formSelector.port = (fromPort) => {
    if (formPredicator.isDigits(fromPort)) {
        return fromPort;
    } else {
        throw new Error(MESSAGE.INVALID_BNF(
            fromPort,
            BNF_TYPE.PORT,
        ));
    }
};

// user = *[ uchar | ";" | "?" | "&" | "=" ]
formSelector.user = (fromUser) => {
    if (formPredicator.isUser(fromUser)) {
        return fromUser;
    } else {
        throw new Error(MESSAGE.INVALID_BNF(
            fromPort,
            BNF_TYPE.USER,
        ));
    }
};

// password = *[ uchar | ";" | "?" | "&" | "=" ]
formSelector.password = (fromUser) => {
    if (formPredicator.isPassword(fromUser)) {
        return fromUser;
    } else {
        throw new Error(MESSAGE.INVALID_BNF(
            fromPort,
            BNF_TYPE.PASSWORD,
        ));
    }
};

formSelector.urlPath = (fromUrlPath) => {
    if (!formPredicator.isXchars(fromUrlPath)) {
        throw new Error(MESSAGE.INVALID_BNF(
            fromUrlPath,
            BNF_TYPE.URL_PATH,
        ));
    }
    const queryStart = fromUrlPath.indexOf('?');
    let query = '';
    let path = '';
    if (queryStart !== -1) {
        query = fromUrlPath.slice(queryStart + 1);
        path = fromUrlPath.slice(0, queryStart);
    } else {
        path = fromUrlPath.slice();
    }
    debug('path and query is', path, query);
    return {
        path,
        query,
    };
};

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
    self.scheme = formSelector.scheme(genericChunks.scheme);
    self.isFileURL = SCHEME_TYPE.FILE === self.scheme;

    const schemePartChunks = formSelector.schemePart(genericChunks.schemePart);

    const loginChunks = formSelector.login(schemePartChunks.login);
    self.user = formSelector.user(loginChunks.user);
    self.password = formSelector.password(loginChunks.password);

    const hostportChunks = formSelector.hostport(loginChunks.hostport);
    self.host = formSelector.host(hostportChunks.host);
    self.port = formSelector.port(hostportChunks.port);
    self.port = matchPortWithScheme(self.port);

    const urlPathChunks = formSelector.urlPath(schemePartChunks.urlPath);

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
}

module.exports = {
    Url,
    formPredicator,
    formSelector,
}
