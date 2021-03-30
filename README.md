# lighthouse-pharos
Script that automates Lighthouse audits and exports results to a CSV. Can support multiple runs. Allows usage of DevTools overrides on each test.

Tests run in headful Chrome launched via Puppeteer. Overrides and other DevTools configurations can be used on each report by passing your local instance of Chrome along with its user data files (see userDataDir on options).

## Status
Alpha
## Usage
```
node script.js --uri [URI]
```

This will launch Puppeteer headful with Chromium and run 1 test, outputting a CSV with the summarized results and a JSON with the full Lighthouse report.

Results are saved under the 'results' folder inside the project.

### Options
- uri: URI that tests should run against
- totalTests: number of tests that will run (default: 1)
- executablePath: path of Chrome installation to use (defaults to Chromium)
- userDataDir: path of user data folder to use
- outputFilename: name of output file for CSV and JSON file (defaults to 'results-{timestamp}'
- desktop: makes tests run on desktop configuration (defaults to mobile)

### Using overrides
Setup the overrides manually in your Chrome of preference (Chromium or Canary is recommended by Lighthouse documentation).

Then pass the userDataDir and executable of the Chrome installation to the script.
## Example
http://recordit.co/A9jzTzLPeR

## Future Work
- [ ] Improve maintanability of CSV exporter
- [ ] Include parameter for max load time of page
- [ ] Choose where results will be written
- [ ] Optional parameter to open DevTools in audit
- [ ] Choose depth of audit (only performance is allowed for now)
- [ ] Choose format of output (JSON and CSV are supported for now, but HTML can also be generated)

## Known Bugs
Lighthouse sometimes hangs around page load time when the DevTools are open. This happens in some pages but not in others. Same bug also happens when running Lighthouse via Chrome DevTools.