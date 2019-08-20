
const { formPredicator, formSelector } = require('../src/url.js');

describe('formPredicator', () => {
    const testcases = {

    };
});

describe('formSelector', () => {
    const testcases = {
        genericUrl: [
            {
                data: 'http://user_name:pass-word@test.my-url.or.kr:2019/first/second/last?query=ab&param=12',
                answer: {
                    scheme: 'http',
                    schemePart: '//user_name:pass-word@test.my-url.or.kr:2019/first/second/last?query=ab&param=12'
                },
            },
        ],
        scheme: [
            {
                data: 'http',
                answer: 'http',
            },
        ],
        schemePart: [
            {
                data: '//user_name:pass-word@test.my-url.or.kr:2019/first/second/last?query=ab&param=12',
                answer: {
                    login: 'user_name:pass-word@test.my-url.or.kr:2019',
                    urlPath: 'first/second/last?query=ab&param=12',
                },
            },
            {
                data: '//login//xchars',
                answer: { xchars: '//login//xchars' },
            },
        ],
        login: [
            {
                data: 'user_name:pass-word@test.my-url.or.kr:2019',
                answer: {
                    user: 'user_name',
                    password: 'pass-word',
                    hostport: 'test.my-url.or.kr:2019',
                },
            },
            {
                data: 'test.or.kr',
                answer: {
                    user: '',
                    password: '',
                    hostport: 'test.or.kr',
                },
            },
        ],
        hostport: [
            {
                data: 'test.my-url.or.kr:2019',
                answer: {
                    host: 'test.my-url.or.kr',
                    port: '2019',
                },
            },
            {
                data: 'test.co.kr',
                answer: {
                    host: 'test.co.kr',
                    port: '',
                },
            },
        ],
        host: [
            {
                data: 'test.my-url.or.kr',
                answer: 'test.my-url.or.kr',
            },
        ],
        port: [
            {
                data: '',
                answer: '',
            },
            {
                data: '2019',
                answer: '2019',
            },
        ],
    };

    const errorTestcases = {
        scheme: [
            {
                data: 'HTTP',
                answer: '',
            },
            {
                data: '',
                answer: '',
            },
        ],
        login: [
            {
                data: 'user_name:@hostport',
                answer: '',
            },
            {
                data: ':password@hostport',
                answer: '',
            },
            {
                data: '@hostport',
                answer: '',
            },
        ],
        hostport: [
            {
                data: ':2019',
                answer: '',
            },
        ],
    };

    test('::genericUrl', () => {
        testcases.genericUrl.map((testcase) => {
            expect(formSelector.genericUrl(testcase.data))
                .toEqual(testcase.answer);
        });
    });
    test('::scheme', () => {
        testcases.scheme.map((testcase) => {
            expect(formSelector.scheme(testcase.data))
                .toEqual(testcase.answer);
        });

        errorTestcases.scheme.map((testcase) => {
            expect(() => formSelector.scheme(testcase.data))
                .toThrow();
        });
    });

    test('::schemePart', () => {
        testcases.schemePart.map((testcase) => {
            expect(formSelector.schemePart(testcase.data))
                .toEqual(testcase.answer);
        });
    });

    test('::login', () => {
        testcases.login.map((testcase) => {
            expect(formSelector.login(testcase.data))
                .toEqual(testcase.answer);
        });

        errorTestcases.login.map((testcase) => {
            expect(() => formSelector.login(testcase.data))
                .toThrow();
        });
    });

    test('::hostport', () => {
        testcases.hostport.map((testcase) => {
            expect(formSelector.hostport(testcase.data))
                .toEqual(testcase.answer);
        });

        errorTestcases.hostport.map((testcase) => {
            expect(() => formSelector.hostport(testcase.data))
                .toThrow();
        });
    });

    test('::host', () => {
        testcases.host.map((testcase) => {
            expect(formSelector.host(testcase.data))
                .toEqual(testcase.answer);
        });
    });

    test('::port', () => {
        testcases.port.map((testcase) => {
            expect(formSelector.port(testcase.data))
                .toEqual(testcase.answer);
        });
    });
});
