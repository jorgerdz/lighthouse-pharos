const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const {
    URL
} = require('url');
const fs = require('fs');
const { transpose } = require('matrix-transpose');
const median = require('median');
const percentile = require('percentile');
const { convertArrayToCSV } = require('convert-array-to-csv');
const argv = require('yargs/yargs')(process.argv.slice(2))
    .demandOption(['uri'])
    .argv;

function getPuppeteerConfig (options) {
    let puppeteerConfig = {
        headless: false,
        devtools: true
    }
    if (options.userDataDir) {
        puppeteerConfig.userDataDir = options.userDataDir;
        //'~/Library/Application\ Support/Google/Chrome\ Canary/'
    }
    if (options.executablePath) {
        puppeteerConfig.executablePath = options.executablePath;
        //'/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
    }
    if (options.desktop) {
        puppeteerConfig.defaultViewport = {
            width: 1920,
            height: 1080
        }
    }
    if (options.customViewportW && options.customViewportH) {
        puppeteerConfig.defaultViewport = {
            width: options.customViewportW,
            height: options.customViewportH
        }
    }
    return puppeteerConfig;
}

function getLighthouseConfig(options) {
    let lighthouseConfig = {
        extends: 'lighthouse:default',
        settings: {
            onlyCategories: ['performance'],
            //maxWaitForLoad: 10000
        }
    }

    if (options.desktop) {
        // Settings taken from https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/constants.js
        Object.assign(lighthouseConfig.settings, {
            formFactor: 'desktop',
            throttling: {
                rttMs: 40,
                throughputKbps: 10 * 1024,
                cpuSlowdownMultiplier: 1,
                requestLatencyMs: 0, // 0 means unset
                downloadThroughputKbps: 0,
                uploadThroughputKbps: 0,
              },
            screenEmulation: {
                mobile: false,
                width: 1350,
                height: 940,
                deviceScaleFactor: 1,
                disabled: false,
              },
            emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4420.0 Safari/537.36 Chrome-Lighthouse'
        })
    }

    if (options.customViewportW && options.customViewportH) {
        Object.assign(lighthouseConfig.settings, {
            formFactor: 'mobile',
            screenEmulation: {
                mobile: true,
                width: options.customViewportW,
                height: options.customViewportH,
                deviceScaleFactor: 2,
                disabled: false,
            },
        });
    }

    return lighthouseConfig
}

async function runTest(uri, options) {
    const puppeteerConfig = getPuppeteerConfig(options)
    const lighthouseConfig = getLighthouseConfig(options)
    const browser = await puppeteer.launch(puppeteerConfig);
    const lighthouseFlags = {
        port: (new URL(browser.wsEndpoint())).port,
        output: 'json',
        logLevel: 'info',
        maxWaitForLoad: 60 * 1000
    }

    // Lighthouse will open the URL.
    // Puppeteer will observe `targetchanged`
    let {lhr} = await lighthouse(uri, lighthouseFlags, lighthouseConfig);
    await browser.close();
    return lhr;
}

(function main() {
    const totalTests = argv.totalTests || 1;
    const uri = argv.uri;
    let tests = [];

    for (let i=0;i<totalTests;i++) {
        tests.push(uri);
    }

    let result = tests.reduce( function (p, nextUri, i) {
        return p.then(function(results) {
            let testNumber = i+1;
            console.log(`Running test #${testNumber}`);
            return runTest(nextUri, argv).then(function(result) {
                results.push(result);
                fs.writeFile(`${getOutputFilename()}_${testNumber}.json`, JSON.stringify(result), () => console.log)
                return results;
            });
        });
      }, Promise.resolve([]));

      result.then(function(results) {
          exportResults(results)
      })
})();

function exportResults(results) {
    let csv = resultsToCsv(results);
    csvToFile(csv);
}

function getOutputFilename() {
    let filename = argv.outputFilename || `results-${new Date().toISOString()}`;
    let parent = './results/'
    return parent + filename;
}

function csvToFile(csv) {
    let filename = getOutputFilename();
    fs.writeFile(filename + '.csv', csv, () => {console.log('Export finished')})
}

function resultsToCsv(results) {
    let summary = [];
    let headers = [];
    let headersRow = [];

    results.forEach(function(result,  i){
        let entry = []
        let metrics = result.audits.metrics.details.items[0];
        let score = result.categories.performance.score;
        let lastKey = '';

        headersRow.push(i+1);
        headers = Object.keys(metrics).filter(function(metric) {
            let lastValue = metrics[lastKey];
            lastKey = metric;
            return !(metric.includes('observed') || metric.includes('layout') || !metrics[metric] || metrics[metric] === lastValue)
        })
        headers.forEach(function(key) {
            entry.push(metrics[key]);
        })
        entry.push(score)
        summary.push(entry);
    })
    headers.unshift('Metrics')
    headers.push('Performance Score')

    let transposed = transpose(summary)
    transposed.forEach(function(row) {
        row.push(median(row))
        row.push(percentile(75,row));
    })
    headersRow.push('Median');
    headersRow.push('P75');
    transposed.unshift(headersRow)
    summary = transpose(transposed);
    summary.unshift(headers)

    return convertArrayToCSV(summary);
}
