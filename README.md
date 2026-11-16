# hermes-uptime-kit

**Zero-server public status page for your services — one repo, GitHub Actions probes it, GitHub Pages serves it. No server, no credentials, no monthly fee for the self-hosted core.**

给跑自建服务/AI agent 的独立开发者：想要一个像 status.deepseek.com 那样的公开可用性状态页，但不想为 Statuspage 付 $29+/月、也不想为监控专门养一台服务器。

> **Status: open-source beta (free). A managed/hosted version is in preparation — no pricing or ETA committed.**
> 当前为开源内测（免费）；托管版筹备中，定价与上线时间以官宣为准。

## 它是怎么跑起来的（探针 100% 外部化）

```
GitHub Actions (*/5min) ──► scripts/probe.cjs ──► status.json ──► push main ──► Pages/静态托管
   (GitHub runner 公网探测)     (状态机累积/重算)     (页面数据源)
```

- 探针只在 GitHub runner 上跑：你的服务器**不需要**装任何 agent，也不需要暴露任何端口给监控方。
- 探测视角 = 公网用户视角（DNS/TLS/HTTP 全链路），不是"机器内部自吹在线"。
- 状态页与你的服务分离部署：你的服务挂了，状态页照样活着——这正是状态页的意义。

## 5 分钟上手

```bash
# 1. Use this template（GitHub 上点 "Use this template"，或手动 clone 本仓）
git clone https://github.com/theBigGavin/hermes-uptime-kit my-status && cd my-status

# 2. 一条命令初始化：填品牌名 + 你的服务 URL（逗号分隔）
UPTIME_BRAND="My Lab" UPTIME_URLS="https://example.com/,https://api.example.com/health" node scripts/init.cjs

# 3. push 到你的 GitHub 仓
git init && git add -A && git commit -m init && git branch -M main
git remote add origin git@github.com:<you>/<my-status>.git && git push -u origin main

# 4. 仓库 Settings → Pages → Deploy from branch (main / root)。
#    Actions 里的 status-probe 工作流已就位，每 5 分钟自动探测并写 status.json。
```

零 secrets：探测与提交用 Actions 自动注入的 `GITHUB_TOKEN`（仅 `contents: write`）。

## 能力（区别于 upptime/gatus 的差异化点）

| 能力 | 说明 |
|---|---|
| HTTP 端点探测 | 2xx/3xx/4xx=ok，5xx=degraded，超时/DNS/TLS=down |
| 90 天可用性热力图 + 组件 uptime% | 自动日聚合、90 天窗口裁剪 |
| incident 状态机 | 连续 3 次 down 自动开 incident；连续 2 次 ok 自动 resolve |
| 恢复感知 | 失败恢复后组件即回绿，不"红着不放" |
| 多语言页面 | zh/en/ja/ko/fr/de/... 13 语言，首帧语言检测防闪烁 |
| 原子写盘 | .bak + .tmp + rename，防半写损坏 |

本 kit 不是玩具：探针与页面源自我们自己生产环境跑了 3 个月的状态页（每天 288 次探测），生产与 kit 共享同一探针代码。

## 本地测试（不碰 Actions）

```bash
PROBE_URLS='[{"id":"t","name":"test","url":"http://127.0.0.1:8099/"}]' \
STATUS_FILE=./tmp-status.json node scripts/probe.cjs
```

## 配置

- `components.json` — 探测目标清单（`init` 生成；手工编辑亦可）
- 探针可调环境变量：`PROBE_TIMEOUT_MS`（默认 10000）、`STATUS_FILE`
- 判定与状态机细节见 `scripts/probe.cjs` 头部注释

## Roadmap（托管版方向，筹备中，无承诺）

自动告警投递（Telegram/邮件）、历史数据更长保留、自定义域名一键部署、SLO/错误预算视图。开源核心版保持免费内测口径；托管版定价与上线以官宣为准，**不承诺永久免费**。

## License

MIT.
