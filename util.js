var _ = require('underscore');
var cheerio = require('cheerio');

function timestamp(r_time, diff) {
  var monthes = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var matches, time;
  if (_.isNumber(r_time)) {
    return r_time;
    // 适配以下规则：
    // '22:15  31 октября 2016'
  } else if ((matches = r_time.trim().match(new RegExp('^((\\d{1,2})\\s*\\:\\s*(\\d{1,2})\\s+)?(\\d{1,2})\\s+(' + monthes.join('|') + ')\\s+(\\d{4,4})$', 'i')))) {
    time = (function($, $1, hour, minute, date, month, year) {
      return new Date([
        year,
        monthes.indexOf(month.toLowerCase()) + 1,
        ('0' + date).substr(-2, 2),
        ('0' + (hour || 0)).substr(-2, 2),
        ('0' + (minute || 0)).substr(-2, 2),
        '00'
      ].map(function(d, i) {
        return d + '-- :: ' [i];
      }).join('').trim());
    }.apply(null, matches));
    // 适配以下规则：
    // '1 ноября 2016, 12:42'
    // '4 сентября 2016 - 06:39'
    // '1 ноября 2016  13:15'
    // '27 октября 2016'
    // '2 июня, 16:46'
  } else if ((matches = r_time.trim().match(new RegExp('^(\\d{1,2})\\s+(' + monthes.join('|') + ')\\s*(\\d{4,4})?[\\,\\-\\s*]+((\\d{1,2})\\s*\\:\\s*(\\d{1,2}))?$', 'i')))) {
    time = (function($, date, month, year, $1, hour, minute) {
      var now = new Date();
      month = monthes.indexOf(month.toLowerCase()) + 1;
      // 没有年份的情况下 如果遇上2017年1月爬了2016年12月的新闻时会导致新闻变成2017年12月
      year = year || (now.getFullYear() - ~~(now.getMonth() <= 2 && month >= 10));
      return new Date([
        year,
        month,
        ('0' + date).substr(-2, 2),
        ('0' + (hour || 0)).substr(-2, 2),
        ('0' + (minute || 0)).substr(-2, 2),
        '00'
      ].map(function(d, i) {
        return d + '-- :: ' [i];
      }).join('').trim());
    }.apply(null, matches));
    // 适配以下规则：
    // '12.11.2016 - 19:04'
    // '12/11/2016 19:04'
  } else if ((matches = r_time.trim().match(new RegExp('^(\\d{1,2})\\s*[\\.\\/]\\s*(\\d{1,2})\\s*[\\.\\/]\\s*(\\d{4})(\\s*\\-?\\s*(\\d{1,2})\\s*\\:\\s*(\\d{1,2}))?$', 'i')))) {
    time = (function($, date, month, year, $1, hour, minute) {
      return new Date([
        year,
        ('0' + month).substr(-2, 2),
        ('0' + date).substr(-2, 2),
        ('0' + (hour || 0)).substr(-2, 2),
        ('0' + (minute || 0)).substr(-2, 2),
        '00'
      ].map(function(d, i) {
        return d + '-- :: ' [i];
      }).join('').trim());
    }.apply(null, matches));
    // 适配以下规则：
    // '2016-11-01 18:21:34'
  } else if ((matches = r_time.trim().match(new RegExp('^(\\d{4,4})[\\s\\-\\.]+(\\d{1,2})[\\s\\-\\.]+(\\d{1,2})([\\s\\:]+(\\d{1,2})([\\s\\:]+(\\d{1,2})([\\s\\:]+(\\d{1,2}))?)?)?$')))) {
    time = (function($, year, month, date, $1, hour, $2, minute, $3, second) {
      return new Date([
        year,
        ('0' + month).substr(-2, 2),
        ('0' + date).substr(-2, 2),
        ('0' + (hour || 0)).substr(-2, 2),
        ('0' + (minute || 0)).substr(-2, 2),
        ('0' + (minute || 0)).substr(-2, 2),
      ].map(function(d, i) {
        return d + '-- :: ' [i];
      }).join('').trim());
    }.apply(null, matches));
  }

  return time ? time.getTime() + ~~diff * 3600 * 1000 : '';
};
exports.timestamp = timestamp;

function filterTitle(title) {
  if (!title) return '';

  return title.trim();
}
exports.filterTitle = filterTitle;

function filterContent(content, opts) {
  var $, regs, xpaths, fns;

  regs = [
    // 滤掉注释
    /<!--[\w\W\r\n]*?-->/g
  ];

  regs.forEach(function(reg) {
    content = content.replace(reg, '');
  });

  $ = cheerio.load(content);

  xpaths = [
    // 删除广告，样式和脚本
    '.ad',
    'script',
    'style',
    'twitterwidget',
    '[class*=twitter]'
  ];
  xpaths.forEach(function(xpath) {
    $(xpath).remove();
  });

  fns = [
    function($) {
      // 删除样式和宽高
      ['style', 'width', 'height', 'class'].forEach(function(attr) {
        $('*').removeAttr(attr);
      });
      // 图片处理
      $('img, iframe').each(function() {
        var $this = $(this);
        var src = $this.attr('src') || $this.attr('data-src');

        if (!src) $this.remove();

        $this.attr('src', fixImage($this.attr('src'), opts));
      });
      // a标签处理
      $('a').each(function() {
        var $this = $(this);
        $(this).replaceWith('<span>' + $this.text() + '</span>');
      });
    }
  ];

  fns.forEach(function(fn) {
    fn($);
  });

  return $.html().trim();
};
exports.filterContent = filterContent;

function filterSummary(summary) {
  if (!summary) return summary;

  return summary.trim();
}
exports.filterSummary = filterSummary;

function filterKeywords(keywords) {
  if (!keywords) return '';

  return keywords.trim();
}
exports.filterKeywords = filterKeywords;

function fixImage(image, opts) {
  if (!image) return '';

  return image.match(/^\/\//) ?
    opts.protocol + image :
    image.match(/^\/\w+/) ?
    opts.domain + image :
    image;
}
exports.fixImage = fixImage;

function getDomain(url) {
  if (!url) return '';

  return url.replace(/^http\:\/\/([^\/\?]+)/, function($, d) {
    return d;
  });
}
exports.getDomain = getDomain;

function getCategoryFirst(url, rule, opts) {
  if (rule && toString.call(rule) === '[object Object]') {
    var info = _.pairs(rule);
    var item = info.filter(function(item) {
      return item[1].test(url);
    }).shift();
    return item && item[0];
  } else if (rule && toString.call(rule) === '[object Function]') {
    return rule(url);
  }
}

function getCategoryList(url, rule) {
  var categoryFirst = getCategoryFirst(url, rule && rule.filter, rule);
  return {
    categoryFirst: categoryFirst || rule.others,
    list: categoryFirst ? rule.pre + categoryFirst : rule.others
  };
}
exports.getCategoryList = getCategoryList;

function getSite() {
  var info = __filename.split(/[\/\\]/);
  return info[info.length - 2];
}
exports.getSite = getSite;

function initConfig(C, space, url) {
  var config = Array.isArray(C[space]) ?
    C[space].filter(function(item) {
      return !item.rule || item.rule.test(url);
    }).shift() :
    null;
  return config && _.extend(C, config);
}
exports.initConfig = initConfig;

var Xpath = function() {
  this.rule = {};
  this.xpath = {};
  this.fns = {};
  this.keys = {};
};
Xpath.prototype = {
  init: function(C) {
    Object.keys(C.xpath).forEach(function(key) {
      this.rule[key] = _.isString(C.xpath[key]) ? [C.xpath[key]] : _.clone(C.xpath[key]);
    }.bind(this));

    Object.keys(this.rule).forEach(function(key) {
      var last = this.rule[key][this.rule[key].length - 1];

      if (_.isFunction(last)) {
        this.fns[key] = last;
        this.rule[key].pop();
      }

      this.rule[key].forEach(function(item, i) {
        var _key = key.replace(/[^\[\]]+/, function($) {
          return $ + i;
        });
        this.keys[key] = this.keys[key] || [];
        this.keys[key].push(_key);
        this.xpath[_key] = item;
      }.bind(this));

    }.bind(this));

    return this.xpath;
  },
  out: function(data) {
    var out = Object.keys(this.keys).reduce(function(ret, key) {
      var args = this.keys[key].map(function(_key) {
        return data[_key.replace(/[\[\]]/g, '')];
      }).concat(cheerio);
      ret[key.replace(/[\[\]]/g, '')] = (this.fns[key] ? this.fns[key] : function() {
        var args = [].slice.call(arguments, 0, arguments.length - 1);
        if (Array.isArray(args[0])) {
          return [].concat.apply([], args);
        } else {
          return args.join('').trim();
        }
      }).apply(null, args);

      return ret;
    }.bind(this), {});

    return out;
  },
  ignore: function(allowFields) {
    return Object.keys(this.xpath).reduce(function(ret, key) {
      var field = allowFields.filter(function(field) {
        return ~key.indexOf(field);
      }).shift();

      field && (ret[key.replace(/\[\]/g, '')] = false);

      return ret;
    }, {});
  }
}
exports.Xpath = Xpath;;

function getBid() {
  var info = __filename.split(/[\/\\]/);
  return info[info.length - 3];
};
exports.getBid = getBid;

function getLanguage(bid) {
  return {
    'i-ru': 'russian'
  }[bid];
}
exports.getLanguage = getLanguage;

function getCountry(bid) {
  return {
    'i-ru': 'russia'
  }[bid];
}
exports.getCountry = getCountry;
