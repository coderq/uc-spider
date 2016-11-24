'use strict';

var _ = require('underscore'),
  ua = require('../../../components/header/ua'),
  Grab = require('../../../components/grab/grab'),
  GrabProxy = require('../../../components/grabproxy/grabProxy').GrabProxy,
  ua = require('../../../components/header/ua'),
  C = require('./config'),
  U = require('./util');

module.exports = function(task) {
  var grab, grabProxy;

  if (!(C = U.initConfig(C, 'list', task.url))) {
    return task.done(Error('Not match rule.'));
  }

  grab = new Grab();
  grabProxy = new GrabProxy({
    task: task,
    grab: grab,
    author: C.author,
    tag: C.tag,
    domain: C.protocol + '//' + C.site,
    check: C.check
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
      var clusterData = grabProxy.parseJson(task.data);
      C.itemMap(data).forEach(function(item) {
        var url = item.url || item;
        var flowerData = item.flowerData || {};
        var info;
        url = url.match(/^http/) ? url : this.bu.domain + url;
        info = U.getCategoryList(url, C.categoryListRule);

        this.bu.flower.push({
          url: url,
          data: _.extend(flowerData, {
            categoryFirst: info.categoryFirst,
            cluster: clusterData.cluster || task.url
          })
        });

        this.bu.extend.push({
          url: url,
          data: [{
            xtype: 'pushRules',
            list: info.list
          }, {
            xtype: "category",
            categoryFirst: info.categoryFirst
          }]
        });

      }.bind(this));
    })
    .then(grabProxy.setHarvest)
    .then(grabProxy.checkHarvest)
    .then(grabProxy.time)
    .done(grabProxy.done);
}
