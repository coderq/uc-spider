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
    [/[^\/]+\/\d+\//, 'html-detail'],
    [/.+/, 'html-list']
  ],
  list: [{
    rule: /ria\.ru\/?$/,
    xpath: {
      'items[]': '.b-index__day-news a@href'
    }
  }, {
    xpath: {
      'items[]': '.b-list .b-list__item a@href'
    }
  }],
  detail: [{
    xpath: {
      'title': 'meta[property="og:title"]@content',
      'keywords': 'meta[name="keywords"]@content',
      'content': [
        '.b-article__main/html()',
        function(html, cheerio) {
          var $ = cheerio.load(html);
          var content = [];
          var $main_body = $('.b-article__ind > .b-article__body');
          if ($main_body.length) {
            $main_body.find('.b-inject__type-article, .b-banner').remove();
            $main_body.find('.b-inject__type-mega').each(function() {
              $(this).replaceWith($(this).find('img'));
            });
            return $main_body.html();
          } else {
            return $('.b-article__video video').html() +
              '<br>' +
              $('.b-article__lead').html();
          }
        }
      ],
      'publishTime': [
        'meta[property="article:published_time"]@content',
        function(text) {
          return text.replace(/^(\d{4,4})(\d{2,2})(\d{2,2})T(\d{2,2})(\d{2,2}).*$/, function() {
            return [].slice.call(arguments, 1, 6).map(function(d, i) {
              return d + '-- : ' [i];
            }).join('').trim();
          });
        }
      ],
      'coverPic': [
        '.b-article__announce-img-wr img@src',
        '.b-article__announce-video-bl video@poster'
      ]
    }
  }],
  categoryListRule: {
    categoryFilter: {
      politics: /politics/,
      society: /society|incidents|media/,
      economics: /economics|company|kurs_rublya/,
      military: /defense_safety/,
      sports: /sports|euro2016|ihwc2016/,
      culture: /75news|culture|museum|prokofiev/,
      entertainment: /rus_cinema/,
      science: /science|engineers|gogland|optical_technologies|atomtec|space/,
      // technology: /.+/,
      // auto: /.+/,
      // lifestyle: /.+/,
      religion: /religion/,
      // astrology: /.+/,
      history: /75names|75photo|75_radio/,
      // realestate: /.+/,
      // relationship: /.+/,
      // childrenrearing: /.+/,
      // inspirational: /.+/,
      education: /education|abitura_/,
      // occupation: /.+/,
      // food: /.+/,
      // fashion: /.+/,
      // shopping: /.+/,
      // travel: /.+/,
      health: /health|disabled_/,
      // humor: /.+/,
      world: /world|syria/,
      // vk_others: /.+/
    },
    listFilter: function(categoryFirst, pre, url, cluster) {
      if (/ria\.ru\/?$/.test(cluster)) {
        return pre + 'headlines';
      } else {
        return pre + categoryFirst;
      }
    },
    pre: site.split('.')[0] + '_',
    others: 'others'
  }
};
