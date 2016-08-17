var express = require('express');
var router = express.Router();
var AV = require('leanengine');
var _ = require('lodash');
const URL = require('url')
const fs = require('fs');
const USE_LOCAL_CASH = false;

var app = express();

var Report = AV.Object.extend('Report');

var marines = null;
const reportPerPage = 10;
var countryData = [{
    id: '1',
    en: 'thailand',
    zh: '泰国',
    regions: [{
        id: '1',
        en: 'similan',
        zh: '斯米兰'
    }, {
        id: '2',
        en: 'koh tao',
        zh: '龟岛'
    }, {
        id: '3',
        en: 'koh lanta',
        zh: '兰塔岛'
    }]
}, {
    id: '2',
    en: 'philippines',
    zh: '菲律宾',
    regions: [{
        id: '1',
        en: 'malapascua',
        zh: '妈妈拍丝瓜'
    }, {
        id: '2',
        en: 'bohol baligasag',
        zh: '薄荷岛'
    }, {
        id: '3',
        en: 'dumaguete apo island',
        zh: '杜马盖地'
    }]
}, {
    id: '3',
    en: 'malaysia',
    zh: '马来西亚'
}, {
    id: '8',
    en: 'indonesia',
    zh: '印度尼西亚',
    regions: [{
        id: '3',
        en: 'bali amed',
        zh: '巴厘岛艾湄湾'
    }, {
        id: '11',
        en: 'raja ampat',
        zh: '四王'
    }]
}, {
    id: '9',
    en: 'egypt',
    zh: '埃及'
}];

function loadReportsFromJson() {
    // var files = fs.readdirSync(".");
    // console.log('1 read dir . :', files);

    var reportsJson = fs.readFileSync('./data/reports.json', "utf-8");
    console.log('1 read divesite json length:', reportsJson.length);
    var s = JSON.parse(reportsJson).results;
    console.log("2 parse divestie json ok", _.size(s), s[0]);
    global.reports = s;
    return s;
}

function makeUrl(url, query, options) {


    // reports?cat=fjeife&page=2
    //url : /repors, /r?cat=, /r?page=, /r?cat=&page=

    //query {cat, page }
    // var s = '/reports/?cat=%E7%9F%B3%E6%96%91%E9%B1%BC';
    var o = URL.parse(url, true);
    // console.log(s, o , o.query);
    // _.unset(o, 'search')
    o.search = undefined;
    _.forEach(query, function(q, key) {
        if (!q) {
            _.unset(query, key);
        }
    })
    o.query = query;

    // console.log('makeUrl()', url, query, URL.format(o));
    return URL.format(o)
        // console.log(URL.format(o), o);
}

function htmlUnescape(str) {
    return str
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function removeTag(s) {
    var reTag = /<(?:.|\s)*?>/g;
    return s.replace(reTag, "");
}
var addReport = function(r) {
    // this.upload(report.file).then(function(thumb){
    // console.log("dataService addReport ",r);
    var reportObject = AV.Object.extend('Report');
    var o = new reportObject();

    var t = r.title;
    //var ts = t.split('(');
    //var t2 = ts[1]||"";
    //var ts2 = [""]
    //if(ts[1]){
    //   ts2 =ts[1].split(')');
    //
    //}
    var f = /[^\(\)（）]+/g;
    var ts = t.match(f);
    // o.set("phptitle", t);
    //o.set("title", ts[1]||"");
    //o.set("titlezh", ts[0]||"");
    var title = {};
    if (ts[0]) title.zh = ts[0];
    if (ts[1]) title.en = ts[1];
    o.set("title", title);

    // console.log("found: " ,t, ts);
    o.set("title", t);

    o.addUnique("images", {
        url: r.thumb
    });
    var content = removeTag(r.content);
    content = htmlUnescape(content)
        //o.set('oldusername', r.username);

    o.set('phpid', r.id);
    o.set('inputtime', r.inputtime);
    var d = new Date(r.inputtime * 1000);
    o.set('timeReport', d);
    o.set('source', r.source || "min");
    // o.set('divesiteId', r.place);
    //o.set('divesiteName', r.divesitename);

    //var divesite = ds[r.place];
    //o.set('regionId', divesite.regionid);
    //o.set('regionName', divesite.region);
    //o.set('countryId', divesite.countryId);
    //o.set('countryName', divesite.country);
    //o.set('divesiteName', r.divesitename);
    o.set('oldurl', r.url);
    o.set('content', content);

    //var region = regions[divesite.regionid];
    //o.set('region', region.title);
    //o.set('country', region.country);
    o.set('status', 1);

    o.set('marinePhpId', r.marine);
    //o.set('marineId', r.marine);
    o.set('marineName', r.marinename);

    // o.set('title',report.title);
    o.set('thumb', r.thumb);
    // o.set('content',report.content);
    // o.set('marine',report.marine);
    o.set('divesite', r.divesite);
    // o.set('divesite',report.divesite);

    o.set('countryId', r.country);

    var c = _.find(countryData, {
        id: r.country
    });
    if (c) {
        console.log("addReport found country", c)
        o.set('country', c.en);
        o.set('country_zh', c.zh);
        if (c.regions) {
            var r = _.find(c.regions, {
                id: r.region
            })
            if (r) {
                o.set('region', r.en);
                o.set('region_zh', r.zh);
            }
        }
    }

    o.save().then(function(object) {
        //  console.log("dataService addReport after add report",object);
    }, function(err) {
        console.log("dataService addReport error", err, r, err.code, err.message);

    });

    // });
}

function countObjects(option) {
    var query = new AV.Query(option.className);
    var filter = option.filter
    for (var key in filter) {
        query.equalTo(key, filter[key]);
    }
    return query.count();
}

function loadObjects(option) {
    var defaultOption = {
        skip: 0,
        limit: 1000,
        withCount: false
    }
    option = _.assign(defaultOption, option)
    var query = new AV.Query(option.className);

    if (!USE_LOCAL_CASH) {
        var filter = option.filter
        for (var key in filter) {
            query.equalTo(key, filter[key]);
        }
    }
    query.skip(option.skip);
    query.limit(option.limit);
    console.log("loadObjects()", option, query)
    return query.find().then(function(results) {
        return results;
    }, function(error) {
        console.log('loadObjects error', error, option);
        return [];
    })

}

function obj2json(o) {
    var r = o.toJSON();

    // console.log(r, r.timeReport, Date.now(), Date(r.time));
    r.time = new Date(r.timeReport.iso);
    // r.content =  r.content.replace(/\\r\\n/g, "<br/>");
    return r;
}



function loadReports(option) {

    if (!USE_LOCAL_CASH) {
        // option.className = 'Report';
        var defaultOption = {
            skip: 0,
            limit: 1000,
            withCount: false
        }
        option = _.assign(defaultOption, option)
        var query = new AV.Query('Report');
        var filter = option.filter
        for (var key in filter) {
            query.equalTo(key, filter[key]);
        }

        query.skip(option.skip);
        query.limit(option.limit);
        query.descending('timeReport');
        console.log("loadReports() will serach by", query);
        return AV.Promise.when(
            query.count(),
            query.find()
        ).then(function(count, results) {
            var json = _.map(results, obj2json);
            console.log("loadReports load ok", json.length)
            var reportsWithCount = {
                count: count,
                reports: json,
                more: count > (option.skip + option.limit)
            }
            return reportsWithCount
        });
    }
    var p;

    if (global.reports && global.reports.length > 0) {
        console.log("loadReports() load cache", global.reports.length)
        var p = new AV.Promise();
        p.resolve(global.reports);
    } else {
        console.log("loadReports() load from lean")
        p = loadObjects({
            className: 'Report',
            // limit:100
        }).then(function(results) {

            global.reports = results;
            global.reports = _.map(global.reports, function(o) {
                var r = o.toJSON();

                // console.log(r, r.timeReport, Date.now(), Date(r.time));
                r.time = new Date(r.timeReport.iso);
                // r.content =  r.content.replace(/\\r\\n/g, "<br/>");
                return r;

            })
            return global.reports;
        });
    }
    var defaultOption = {
        skip: 0,
        limit: 10
    }
    option = _.assign(defaultOption, option)

    return p.then(function(reports) {
        if (option.filter && option.filter.objectId) {
            var reportsWithNext = {
                report: null,
                next: null,
                prev: null
            }
            var reportIndex = _.findIndex(reports, option.filter);
            if (reportIndex >= 1) {
                reportsWithNext.report = reports[reportIndex];
                reportsWithNext.prev = reports[reportIndex - 1];
            }
            if (reportIndex < reports.length - 1) {
                // reportsWithNext.report = reports[reportIndex];
                reportsWithNext.next = reports[reportIndex + 1];
            }
            console.log("loadReports find single report", option, reportsWithNext.report.title)

            // var reportsWithNext = {
            //  report:report,
            //  next:
            //  // reports:_.slice(reports, option.skip, option.skip + option.limit),
            //  // more: reports.length > (option.skip + option.limit)
            // }
            return reportsWithNext;
        }

        if (option.filter) {
            reports = _.filter(reports, option.filter)
        }
        console.log("loadReports", option, reports.length)
        var reportsWithCount = {
            count: reports.length,
            reports: _.slice(reports, option.skip, option.skip + option.limit),
            more: reports.length > (option.skip + option.limit)
        }
        return reportsWithCount;
    })

}

function findReport(reports, filter) {

}

function loadMarines(option) {

    if (global.marines && global.marines.length > 0) {
        console.log("loadMarines() load cache", global.marines.length)
        var p = new AV.Promise();
        p.resolve(global.marines);
        return p;
    } else {
        console.log("loadMarines() load from lean")
        return loadObjects({
            className: 'Marine'
        }).then(function(results) {
            results = _.map(results, function(o) {
                r = o.toJSON();
                r.url = "/reports?cat=" + r.marineCat_zh;
                return r;
            });
            global.marines = results;
            return global.marines;
        });
    }

}

function loadPlaces(option) {

    if (global.places) {
        console.log("loadplaces() load cache", global.places.regions.length)
        var p = new AV.Promise();
        p.resolve(global.places);
        return p;
    } else {
        console.log("loadplaces() load from lean")
        return loadObjects({
            className: 'Place'
        }).then(function(results) {
            var regions = _.map(results, function(o) {
                r = o.toJSON();
                // r.url = "/reports?cat=" + r.marineCat_zh;
                return r;
            });
            var countries = _.uniqBy(regions, 'countryId')
            global.places = {
                regions: regions,
                countries: countries
            };
            console.log("loadplaces() load places", global.places.countries.length)
            return global.places;
        });
    }

}

function renderReports(req, res, next) {
    console.log("renderReports()", req.baseUrl, req.originalUrl);
    res.locals.makeUrl = function(query) {

            // console.log("makeUrl for",  query);
            var q = {
                    // page:nextPage
                }
                // if(req.query){
                //  if(req.query.cat){
                //      q.cat = req.query.cat
                //  }
                // }
            var q = _.assign(q, req.query, query)
                // var nextPageUrl = req.baseUrl + "/page/" + nextPage;
            var url = makeUrl(req.originalUrl, q)
                //
                // var url = req.baseUrl + req.path;
                // // url += "?cat=" + marine.marineCatId;
                // url += "?cat=" + marine.marineCat_zh;
            return url;
        }
        // console.log('renderReports()',req, res );
        // if (req.query) {
        //      status = req.query.status || 0;
        //      errMsg = req.query.errMsg;
        // }
    var query = new AV.Query(Report);
    // query.equalTo('status', parseInt(status));
    // query.include('author');
    query.descending('timeReport');
    // var page = parseInt(req.params.page);

    var page = 0;
    if (req.query && req.query.page) {
        var page = parseInt(req.query.page);
    }

    // var nextPage = page + 1;
    // // var q = {
    // //   page:nextPage
    // // }
    // if(req.query && req.query.cat){
    //  q.cat = req.query.cat
    // }
    // // var nextPageUrl = req.baseUrl + "/page/" + nextPage;
    // var nextPageUrl = makeUrl(req.originalUrl, q)
    //
    var filter = {};
    if (req.query && req.query.cat) {
        filter.marineCat_zh = req.query.cat;
        // filter.marineCatId = req.query.cat;
    }
    if (req.query && req.query.country) {
        filter.country_zh = req.query.country;
        // filter.marineCatId = req.query.cat;
    }
    // console.log(req.originalUrl, req.query, filter)
    var optionForLoadReport = {
        skip: (reportPerPage * page),
        limit: reportPerPage,
        filter : filter
    };
    AV.Promise.when(
        loadPlaces(null),
        loadMarines(null),
        loadReports(optionForLoadReport)
    ).then(function(places, marines, reportsWithCount) {
        var country = null;
        var marineObj = null;
        var marineName = null;
        if (req.query) {
            if (req.query.cat) {
                marineName = req.query.cat;
                marineObj = _.find(marines, {
                    marineCat_zh: marineName
                });
                console.log("find marine", marineName, marineObj)

            }
            if (req.query.country) {
                country = req.query.country

                // filter.marineCatId = req.query.cat;
            }

        }
        var nextPageUrl = undefined;
        if (reportsWithCount.more) {
            var nextPage = page + 1;
            var q = {
                    page: nextPage,
                    cat: marineName,
                    country: country
                }
                // var nextPageUrl = req.baseUrl + "/page/" + nextPage;
            nextPageUrl = makeUrl(req.originalUrl, q)
        }
        console.log("before render", req.originalUrl, marineName, country, reportsWithCount.reports.length)
        res.render('reports', {
            title: 'reports',
            user: req.currentUser,
            reports: reportsWithCount.reports,
            marines: marines,
            countries: places.countries,
            currentPage: page,
            nextPage: nextPageUrl,
            country: country,
            marine: marineName,
            marineObj: marineObj
                // status: status,
                // errMsg: errMsg
        });
    }).catch(next);;

    // loadReports({
    //     skip: reportPerPage * page,
    //     limit: reportPerPage
    // }).then(function(results) {
    //
    //     loadMarines().then(function(marines) {
    //         res.render('reports', {
    //             title: 'reports',
    //             user: req.currentUser,
    //             reports: results,
    //             marines: marines,
    //             currentPage: page,
    //             nextPage: nextPageUrl,
    //             status: status,
    //             errMsg: errMsg
    //         });
    //     })
    //
    // }, function(err) {
    //     if (err.code === 101) {
    //         // 该错误的信息为：{ code: 101, message: 'Class or object doesn\'t exists.' }，说明 Todo 数据表还未创建，所以返回空的 Todo 列表。
    //         // 具体的错误代码详见：https://leancloud.cn/docs/error_code.html
    //         res.render('todos', {
    //             title: 'TODO 列表',
    //             user: req.currentUser,
    //             reports: [],
    //             status: status,
    //             errMsg: errMsg
    //         });
    //     } else {
    //         throw err;
    //     }
    // }).catch(next);

    // query.skip(reportPerPage * page);
    //
    // query.limit(reportPerPage);
    // query.find({
    //      // sessionToken: req.sessionToken
    // }).then(function(results) {
    //
    //      loadMarines().then(function(marines){
    //          res.render('reports', {
    //                  title: 'reports',
    //                  user: req.currentUser,
    //                  reports: results,
    //                  marines: marines,
    //                  currentPage: page,
    //                  nextPage: nextPageUrl,
    //                  status: status,
    //                  errMsg: errMsg
    //          });
    //      })
    //
    // }, function(err) {
    //      if (err.code === 101) {
    //              // 该错误的信息为：{ code: 101, message: 'Class or object doesn\'t exists.' }，说明 Todo 数据表还未创建，所以返回空的 Todo 列表。
    //              // 具体的错误代码详见：https://leancloud.cn/docs/error_code.html
    //              res.render('todos', {
    //                      title: 'TODO 列表',
    //                      user: req.currentUser,
    //                      reports: [],
    //                      status: status,
    //                      errMsg: errMsg
    //              });
    //      } else {
    //              throw err;
    //      }
    // }).catch(next);

}
/**
 * 定义路由：获取所有 Todo 列表
 */
router.get('/', function(req, res, next) {
    renderReports(req, res, next);
});
router.get('/test', function(req, res, next) {

    console.log("test", global.marines);
    loadReportsFromJson()
    res.render('test', {
        title: 'tset',
        user: req.currentUser,
        content: " jfeifefei ejfjfefie jfejfiefe<p>2nd line"
    });
});
router.get('/:id', function(req, res, next) {
    AV.Promise.when(
        // loadPlaces(),
        // loadMarines(),
        loadReports({
            filter: {
                objectId: req.params.id
            }
        })).then(function(reportWithNext) {

        console.log("before render", req.originalUrl, reportWithNext)
        var report = reportWithNext.report;
        res.render('report', {
            title: report.title,
            user: req.currentUser,
            report: reportWithNext.report,
            next: reportWithNext.next,
            prev: reportWithNext.prev

        });
    }).catch(next);;

});
router.get('/page/:page', function(req, res, next) {
    renderReports(req, res, next);
});

router.get('/marine/:marineCat', function(req, res, next) {
    console.log('/marine/:marineCat', req.params.marineCat)
    renderReports(req, res, next);
});


router.get('/update', function(req, res, next) {

    var TestObject = AV.Object.extend('TestObject');
    var testObject = new TestObject();
    testObject.save({
        words: 'Hello World form upate!'
    }).then(function(object) {
        //  alert('LeanCloud Rocks!');
        console.log(object)
        res.render('json', {
            title: 'report list',
            result: object,

            // user: req.currentUser,
            reports: []
                // status: status,
                // errMsg: errMsg
        });
    })

});



module.exports = router;
