var U = require('./util');
var ua = require('../../../components/header/ua');
var site = U.getSite();
var bid = U.getBid();
var language = U.getLanguage(bid);
var country = U.getCountry(bid);

function urlFilter(url) {
  return /.+/.test(url);
}

module.exports = {
  author: 'zhangyq',
  protocol: 'http:',
  tag: bid + '-news',
  site: site,
  timeDiff: 5,
  country: country,
  language: language,
  route: [
    [/news\/?$/, 'html-list'],
    [/news\/\d+/, 'html-detail']
  ],
  httpConfig: {
    headers: {
      'User-Agent': ua.get('pc')
    },
    encoding: 'windows-1251',
    detectEncoding: false,
    timeout: 8000
  },
  list: [{
    rule: /.*/,
    xpath: {
      'items[]': '.title .tpnl@href'
    }
  }],
  detail: [{
    xpath: {
      'title': 'meta[property="og:title"]@content',
      'keywords': 'meta[name="keywords"]@content',
      'content': 'span[itemprop="articleBody"]/html()',
      'publishTime': [
        '.datetime/html()',
        function(text) {
          return text.replace(/([\d\:]+)\s*<span>([\d\.]+)<\/span>/, function($, time, date) {
            return date + ' ' + time;
          });
        }
      ],
      'coverPic': 'span[itemprop="articleBody"] img@src'
    }
  }],
  categoryListRule: {
    categoryFilter: {
      // politics: /.+/,
      // society: /.+/,
      // economics: /.+/,
      // military: /.+/,
      // sports: /.+/,
      // culture: /.+/,
      // entertainment: /.+/,
      // science: /.+/,
      technology: /.+/,
      // auto: /.+/,
      // lifestyle: /.+/,
      // religion: /.+/,
      // astrology: /.+/,
      // history: /.+/,
      // realestate: /.+/,
      // relationship: /.+/,
      // childrenrearing: /.+/,
      // inspirational: /.+/,
      // education: /.+/,
      // occupation: /.+/,
      // food: /.+/,
      // fashion: /.+/,
      // shopping: /.+/,
      // travel: /.+/,
      // health: /.+/,
      // humor: /.+/,
      // world: /.+/,
      // vk_others: /.+/
    },
    pre: site.split('.')[0] + '_',
    others: 'others'
  }
};
