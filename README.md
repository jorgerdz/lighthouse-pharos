# lighthouse-pharos
Script that automates Lighthouse tests and exports results to a CSV. Can support multiple runs. Allows usage of DevTools overrides on each test.

Tests run in headful Chrome launched via Puppeteer. Overrides and other DevTools configurations can be used on each report by passing your local instance of Chrome along with its user data files.

## Usage
```
node script.js --url [URI]
```