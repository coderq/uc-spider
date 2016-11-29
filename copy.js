var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var program = require('commander');

program.option('-b, --bid <bid>', 'bid')
  // 用domain会有异常。。。噗 ！！
  .option('-d, --dir <domain1, domain2, ...>', 'domain')
  .option('-c, --create', 'create domain')
  .option('-u, --update', 'update domain')
  .parse(process.argv)
  .on('-h, --help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ -b --bid 指定操作的国家文件夹');
    console.log('    $ -d --domain 指定操作的网站域名');
    console.log('    $ -c --create 指定行为为创建');
    console.log('    $ -u --update 指定行为为更新');
    console.log();
  });

if (!program.bid) {
  throw Error('必要字段bid未定义');
}
if (!program.dir) {
  throw Error('必要自断domain为定义');
}

// 更新本地代码，保证代码最新
function pullGit() {
  return new Promise(function(resolve, reject) {
    cp.exec('git pull', function(err) {
      if (err) reject(err);
      else resolve(program);
    })
  });
}

function createDomain(program) {
  return new Promise(function(resolve, reject) {
    var p = path.resolve(__dirname, '../bee', program.bid, program.dir);
    if (fs.existsSync(p) && fs.lstatSync(p).isDirectory())
      throw Error('目标文件夹已存在');
    // 创建文件夹
    fs.mkdirSync(p);
    // 复制文件
    [
      './_.js',
      './html-detail.js',
      './html-list.js',
      './json-detail.js',
      './json-list.js',
      './util.js'
    ].forEach(function(f) {
      fs.createReadStream(path.resolve(__dirname, f))
        .pipe(fs.createWriteStream(path.resolve(p, f)));
    });
  });
}

var action = program.create ?
  createDomain :
  program.update ?
  updateDomain :
  function() {
    throw Error('未定义的操作');
  }

Promise
  .resolve()
  .then(pullGit)
  .then(action)
  .catch(console.log);
