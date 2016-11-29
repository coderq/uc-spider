'use strict';

var _ = require('underscore'),
  cheerio = require('cheerio'),
  Grab = require('../../../components/grab/grab'),
  GrabProxy = require('../../../components/grabproxy/grabProxy').GrabProxy,
  ua = require('../../../components/header/ua'),
  C = require('./config'),
  U = require('./util');

module.exports = function(task) {
  var grab, grabProxy, xpath, xdata, articleFrom,
    allowEmpty = ['coverPic', 'relativeNews', 'keywords'];

  if (!(C = U.initConfig(C, 'detail', task.url))) {
    return task.done(Error('Not match rule.'));
  }

  // 如果是聚合网站，会有originalUrl属性，则取其值
  articleFrom = C.articleFrom || U.getDomain(task.originalUrl || task.url, true);
  xpath = new U.Xpath();
  xdata = xpath.init(C);

  grab = new Grab();
  grabProxy = new GrabProxy({
    task: task,
    grab: grab,
    author: C.author,
    tag: C.tag,
    domain: C.protocol + '//' + C.site,
    check: C.check || {
      data: xpath.ignore((C.allowEmpty || []).concat(allowEmpty))
    }
  });

  grab
    .config(C.httpConfig || {
      headers: {
        'User-Agent': ua.get('pc')
      },
      timeout: 10000,
      gzip: true
    })
    .error(grabProxy.error)
    .get(task.url)
    .then(grabProxy.checkJson)
    .data(function(data) {
      var flower, extend, relatedNews, flowerData, taskUrlInfo;

      data = C.itemFilter(data);

      flower = [];
      extend = [];
      relatedNews = [];
      flowerData = grabProxy.parseJson(task.data);
      taskUrlInfo = U.getCategoryList(task.url, flowerData.cluster, C.categoryListRule);

      // 如果该新闻已经是关联新闻则不爬取
      if (!flowerData.isRelated && data.relativeNews && data.relativeNews.length) {
        data.relativeNews.forEach(function(url) {
          var relativeNewsInfo;

          url = url.match(/^http/) ? url : this.bu.domain + url;
          relativeNewsInfo = U.getCategoryList(url, flowerData.cluster, C.categoryListRule);

          relatedNews.push({
            xtype: 'relatedNews',
            originalUrl: url
          });

          flower.push({
            url: url,
            data: {
              isRelated: true,
              categoryFirst: relativeNewsInfo.categoryFirst
            }
          });

          extend.push({
            url: url,
            data: [{
              xtype: 'pushRules',
              list: relativeNewsInfo.list
            }, {
              xtype: "category",
              categoryFirst: relativeNewsInfo.categoryFirst
            }, {
              xtype: 'isRelated',
              related: true
            }]
          });
        }.bind(this));
      }

      this.bu.honey = {
        originalUrl: task.url,
        title: U.filterTitle(data.title || flowerData.title),
        summary: U.filterSummary(data.summary || flowerData.summary),
        articleFrom: articleFrom,
        domain: C.site,
        belongSite: C.site,
        belongSeed: this.bu.domain,
        language: C.language,
        country: C.country,
        sourcePublishTime: U.timestamp(data.publishTime || flowerData.publishTime, C.timeDiff),
        sourcePublishLabel: data.publishTime,
        totalPage: 1,
        categoryFirst: taskUrlInfo.categoryFirst || flowerData.categoryFirst,
        keywords: U.filterKeywords(data.keywords || flowerData.keywords),
        contentProvider: {
          cpKey: C.getCPKey ? C.getCPKey(task.url) : articleFrom,
          isCooperation: false,
          name: '',
          logo: ''
        },
        cluster: flowerData.cluster,
        coverPic: U.fixImage(data.coverPic || flowerData.coverPic, {
          domain: this.bu.domain,
          protocol: C.protocol
        }) || '',
        relatedNews: relatedNews,
        pages: [{
          pageNumber: 1,
          originalUrl: task.url,
          content: U.filterContent(data.content, {
            protocol: C.protocol,
            domain: C.protocol + '//' + C.site
          })
        }]
      };

      this.bu.flower = flower;
      this.bu.extend = extend;
    })
    .then(grabProxy.setHarvest)
    .then(grabProxy.checkHarvest)
    .then(grabProxy.time)
    .done(grabProxy.done);
}
