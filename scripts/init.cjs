#!/usr/bin/env node
'use strict';
/**
 * init.cjs — hermes-uptime-kit 一键初始化
 *
 * 用法：node scripts/init.cjs
 *   交互式（TTY）逐项询问；非交互可用环境变量：
 *     UPTIME_BRAND="My Lab" UPTIME_URLS="https://a.com,https://b.com/health" node scripts/init.cjs
 *
 * 产物：
 *   components.json          — 探针目标清单（probe.cjs 读取）
 *   index.html/app.js/style.css 从 template/ 拷到仓库根（GitHub Pages 直接可服务）
 *   status.json              — 空种子（唯一合法生成者是 Actions，见 README）
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'template');

function ask(rl, q, def) {
  return new Promise((res) => rl.question(`${q}${def ? ` [${def}]` : ''}: `, (a) => res(a.trim() || def)));
}

(async () => {
  const envUrls = process.env.UPTIME_URLS;
  const envBrand = process.env.UPTIME_BRAND;
  let brand = envBrand, urlsLine = envUrls;

  if (!envUrls || !envBrand) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    brand = brand || (await ask(rl, 'Brand name (页面标题)', 'My Services'));
    urlsLine = urlsLine || (await ask(rl, 'Service URLs, comma-separated', 'https://example.com/'));
    rl.close();
  }

  const urls = urlsLine.split(',').map((u) => u.trim()).filter(Boolean);
  if (!urls.length) { console.error('no URLs given'); process.exit(1); }

  const components = urls.map((u, i) => {
    let id = 'svc';
    try { id = (new URL(u).hostname.split('.')[0]) + (i ? '-' + i : ''); } catch (e) {}
    return { id, name: id, name_en: id, url: u };
  });
  fs.writeFileSync(path.join(ROOT, 'components.json'), JSON.stringify(components, null, 2) + '\n');

  for (const f of ['index.html', 'app.js', 'style.css']) {
    let s = fs.readFileSync(path.join(TEMPLATE, f), 'utf8');
    if (f === 'index.html') s = s.split('My Services').join(brand).split('My Status').join(brand + ' Status');
    if (f === 'app.js') s = s.split("'My Status").join(`'${brand} Status`).split('My Status').join(brand + ' Status');
    fs.writeFileSync(path.join(ROOT, f), s);
  }

  if (!fs.existsSync(path.join(ROOT, 'status.json'))) {
    fs.writeFileSync(path.join(ROOT, 'status.json'), JSON.stringify({
      schema_version: 1, generated_at: null, overall: 'operational',
      components: [], today_checks: [], history_90d: [], incidents: [],
    }, null, 2) + '\n');
  }
  console.log(`OK. brand="${brand}", ${components.length} service(s) -> components.json`);
  console.log('Next: push to GitHub, enable Pages + this repo\'s status-probe Action. See README.');
})();
