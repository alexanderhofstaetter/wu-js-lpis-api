// 
// Alexander Hofstätter 
// https://github.com/alexanderhofstaetter/
// 
// usage: casperjs flips.js <matrk> <mode> [password] [ASPP] [SPP] [SPAN]
// 
// A tool to automate some actions on LPIS
// It can also be used to automate (and nearly guarantee) the registration for a course
// 
// Flips is a synonom for 'F*ck LPIS'

var url = 'https://lpis.wu.ac.at/lpis/';
var fs = require('fs');
var data_dir = 'data';
var matrk, pass, url_scraped, url_lv;
var lv_url, ASPP, SPP, A, F, SH, span;

var utils = require('utils');

var data = {};

function saveCookies(cookiesPath) {
    var cookies = JSON.stringify(phantom.cookies);
    fs.write(cookiesPath, cookies, 644);
}

function loadCookies(cookiesPath) {
    var data = fs.read(cookiesPath);
    phantom.cookies = JSON.parse(data);
}

function filename(name) {
    return fs.pathJoin(fs.workingDirectory, data_dir, matrk, matrk+'-'+name+'.json');
}

var casper = require('casper').create({   
    verbose: true, 
    logLevel: 'debug',
    pageSettings: {
         loadImages:  false,         // The WebPage instance used by Casper will
         loadPlugins: false,         // use these settings
         userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9'
    }
});

// Set Timeout to 20s (Applies to all CasperJS WaitFor* Functions)
// This is needed because LPIS may lag a little bit at registration start time
// and to be sure that the request did not get aborted
casper.options.waitTimeout = 30000;
/*casper.options.onResourceRequested = function(C, requestData, request) {
    if (requestData.method == 'POST')
    utils.dump(requestData);
};*/


// print out all the messages in the headless browser context
casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
});
// print out all the errors in the headless browser context
casper.on("page.error", function(msg) {
    this.echo("Page Error: " + msg, "ERROR");
});

// Check Args
// 1. Check Matrikelnummer (Login/User)
if (casper.cli.has(0))  matrk = casper.cli.get(0);
fs.write(filename('matrk'), JSON.stringify(matrk), 'w');

// Check script mode
if (casper.cli.get(1) == 'init')        init();
if (casper.cli.get(1) == 'faecher')     faecher_info();
if (casper.cli.get(1) == 'abschnitte')  abschnitte_info();
if (casper.cli.get(1) == 'lv-info')     lv_info();
if (casper.cli.get(1) == 'lv-register') lv_register();

// Inits a LPIS Session. Stores cookies and Randomized URL
// This is needed for every other Mode first
function init() {
    if (casper.cli.has(2))  pass = casper.cli.get(2);
    // Login
    casper.start(url, function() {
        // Wait till form has loaded
        casper.waitForSelector('form#login', function() {
            // Fill the form with login data and submit it
    		casper.fillSelectors('form#login', { 
    			'input[accesskey="u"]': matrk,
    			'input[accesskey="p"]': pass,
    		}, true);
    	});
    });
    // Export Scraped URL 
    // THis is the randomized LPIS URL
    // Example: https://lpis.wu.ac.at/kdcs/bach-s[xx]/[xxxxx]/
    // Where [x] is a random integer number
    casper.then(function() {
        url_scraped = casper.getCurrentUrl();
        url_scraped = url_scraped.substr(0, url_scraped.lastIndexOf("/") + 1);
        fs.write(filename('url_scraped'), JSON.stringify(url_scraped), 'w');
        saveCookies(filename('cookies'))
    });

    casper.then(function() {
        // To fullfill the graphical experience, 
        // make a screenshot of the result 
        // after all the "magic" LPIS action happend above
        casper.capture('1-init.png');
    });
    
}

// Retrieves all available subjects
function faecher_info() {

    // Load Cookies and URL
    loadCookies(filename('cookies'));
    url_scraped = JSON.parse(fs.read(filename('url_scraped')));

    // Start LPIS at the Endpoint /EA (Einzelanmeldung)
    casper.start(url_scraped+'EA', function() {
        // Wait till section (Studienabschnitt) selection form has loaded
        casper.waitForSelector('form#ea_stupl', function() {
            // Select the section
            casper.click('form#ea_stupl input:last-child');
            // Wait till subject list has loaded
            casper.waitForSelector('.b3k-data', function() {
                // Get all subjects as json and export them
                var faecher = casper.getElementsInfo('.b3k-data tbody tr');
                fs.write(filename('faecher'), JSON.stringify(faecher), 'w');
                console.log(JSON.stringify(faecher))
            });
        });
    });
}

// Retrieves all available sections (Studienabschnitte)
function abschnitte_info() {

    // Load Cookies and URL
    loadCookies(filename('cookies'));
    url_scraped = JSON.parse(fs.read(filename('url_scraped')));

    // Start LPIS at the Endpoint /EA (Einzelanmeldung)
    casper.start(url_scraped+'EA', function() {
        // Wait till section (Studienabschnitt) list has loaded
        casper.waitForSelector('form#ea_stupl', function() {
            // Get all section options and export them
            data['abschnitte'] = casper.getElementsInfo('form#ea_stupl select > option');
        });
    });

}

// Retrieves infos and all available courses for a specific subject
function lv_info() {
    // Get some args 
    // ASPP -> AbschnittsPlanPunkt
    // SPP  -> StudienPlanPunkt
    // SH   -> (unsure) Maybe some student specific number?
    if (casper.cli.has(2))  ASPP = casper.cli.get(2);
    if (casper.cli.has(3))  SPP = casper.cli.get(3);
    if (casper.cli.has(4))  F = casper.cli.get(4);

    SH = ASPP.substring(0, ASPP.indexOf('_'));

    // Load Cookies and URL
    loadCookies(filename('cookies'));
    url_scraped = JSON.parse(fs.read(filename('url_scraped')));
    // Build single subject url at endpoint /DLVO (maybe: DetailListeVOrlesung)
    url_lv = url_scraped + 'DLVO' + '?' + 'ASPP=' + ASPP + ';' + 'SPP=' + SPP + ';' + 'F=' + F + ';' + 'SH=' + SH + ';';

    // Start LPIS at the single LV endpoint
    casper.start(url_lv, function() {
        // Wait till loaded
        casper.waitForSelector('.b3k-data', function() {
            // Get all courses
            var veranstaltungen = casper.getElementsInfo('.b3k-data tbody tr');
            // Export a json of all available courses (Veranstaltungen)
            fs.write(filename('veranstaltungen'), JSON.stringify(veranstaltungen), 'w');
            // Export single LV link
            fs.write(filename('url_lv'), JSON.stringify(url_lv), 'w');
        });
    });
}

// Register a student for a specific course (e.g. PI)
function lv_register() {
    // Time infos
    var currentdate = new Date();
    var time = currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
    casper.echo("Starting at: "+time);

    // Get args
    // span -> the html form name / id of the registration form for a specific course
    //         it has the format of "SPAN_[XXXXXX]_[YYYYYY]"
    //         where [XXXXXX] is an specific internal course ID
    //         and [YYYYYY] is the same as the "SH" var (see above)
    var F = '';
    if (casper.cli.has(2))  ASPP = casper.cli.get(2);
    if (casper.cli.has(3))  SPP = casper.cli.get(3);
    if (casper.cli.has(4))  span = casper.cli.get(4);
    if (casper.cli.has(5))  F = casper.cli.get(5);


    // T, LV -> this is an identifier for a specific course
    //          it can be retrieved from the SPAN var (it is the [XXXXXX] part)
    // RA    -> Maybe some kind of "Remote Argument"
    //          Possible values are: "span" (for registration); "wladd" (waiting list add)
    
    var T = span.substring(span.indexOf("_") + 1).substring(0, span.substring(span.indexOf("_") + 1).indexOf('_'));
    var LV = T;
    var RA = 'span';
    SH = ASPP.substring(ASPP.indexOf("_") + 1);


    // Load Cookies and URL
    loadCookies(filename('cookies'));
    url_scraped = JSON.parse(fs.read(filename('url_scraped')));
    url_lv = url_scraped + 'DLVO' + '?' + 'ASPP=' + ASPP + ';' + 'SPP=' + SPP + ';' + 'F=' + F + ';' + 'SH=' + SH + ';';

    // Start LPIS at the Endpoint /DLVO
    casper.start(url_lv, function() {
        currentdate = new Date();
        var time = currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
        casper.then(function() {
            casper.capture('2-register.png');
        });
        casper.echo("Starting request at: "+time);
        // Wait till course list has loaded
        casper.waitForSelector('form#'+span, function() {
            // Evaluate if the course form has the right input parameters
            // if not: add them (SH, T, LV, RA) as hidden input fields
            // this may be necessary if the course list has been load before the registration starts
            // when registration is disabled: some hidden inputs are missing
            // When the course list is loaded at a time where registration has already been started,
            // they are there by default. Because we know the missing fields (and their values), 
            // we can add them before the registration starts. This saves us one request compared to
            // manual registration, therefore we should be much faster as everyone else.
            // BUT: adding the missing fields before reg time has started will result in an error
            // So adding the fields, actually does not bring anything :)
            casper.evaluate(function(formSelector, values){
                if (!document.getElementsByName("RA")[0]) {
                    var form = document.querySelector(formSelector);
                    for(var key in values) {
                        if (values.hasOwnProperty(key)) {
                            // create the hidden input (with type, name, value)
                            var hidden = document.createElement("input");
                            hidden.type = "hidden"
                            hidden.name = key;
                            hidden.value = values[key];
                            // and add them to the DOM
                            form.appendChild(hidden);
                        }
                    }
                }
            }, 'form#'+span, {SH: SH, T: T,LV: LV, RA: 'span'}); 
        });
    });

    casper.then(function() {
        // Then: Submit the registration form for the course
        // Notice: While above steps could be done before the registation starts,
        // this needs to be done AFTER the registration has started, otherwise the server 
        // wont process our registration!
        currentdate = new Date();
        var time = currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
        casper.echo("Starting POST request at: "+time);
        casper.fill('form#'+span, null, true);
    });
    casper.then(function() {
        casper.capture('result.png');
    });
}

casper.on('run.complete', function() {
    console.log(JSON.stringify(data, null, "\t"))
});

casper.run();
