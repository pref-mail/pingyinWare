# 植物大战僵尸 · 拼音版

用拼音答题打僵尸的塔防小游戏：僵尸举着汉字牌进攻，答对拼音就能秒杀它。Node 负责服务驱动，HTML + CSS + Canvas 负责页面与动画，另有 Electron 打包的 Windows 单文件桌面版。

## 下载

- **Windows x64 免安装版**：[Release v1.0.0](https://github.com/pref-mail/pingyinWare/releases/tag/v1.0.0) → `PVZ-Pinyin-1.0.0-portable.exe`（约 106 MB）
- 双击即可运行，无需安装；首次启动会解压到临时目录，稍慢几秒
- 成绩保存在 `%APPDATA%\pvz-pinyin\data\scores.json`

## 玩法

1. 点「开始游戏」，僵尸会从右侧沿 5 条草地推进，头顶显示汉字。
2. 面板弹出拼音选项，**答对**即天降光束秒杀最近的僵尸，并获得得分和阳光。
3. **答错**会扣阳光、重置连击，并让僵尸短暂加速，选项会被禁用。
4. 用阳光种植：🌻 向日葵（50，每 7 秒产 25 阳光）、🌱 豌豆射手（100，自动攻击同排僵尸）。
5. 共 5 波、3 条命；僵尸走到房子会掉命，漏完即失败，撑过第 5 波通关。

### 操作

| 操作 | 说明 |
| --- | --- |
| 点击植物卡片 → 点击草地格子 | 种植植物 |
| `1` / `2` | 快速选择向日葵 / 豌豆射手 |
| `Esc` / `Space` | 暂停 / 继续 |
| 点击拼音选项 | 作答 |

## 特性

- 90 个词分 3 关：单韵母基础字、复韵母生活字、整体认读挑战字
- 连击加成：答得越快越准，单题得分越高
- 僵尸分普通、快速、护甲三类，波次越高越强
- 纯程序化音效（WebAudio），无外部素材依赖
- 成绩榜保存在服务端，重启不丢失

## 本地运行

```bash
# 纯网页模式（零运行时依赖，Node >= 16）
npm start
# 打开 http://localhost:3000

# 桌面窗口模式
npm install
npm run electron
```

## 打包 Windows exe

```bash
npm install
npm run build:exe
```

产物输出到 `dist/PVZ-Pinyin-1.0.0-portable.exe`。

国内网络建议先设置镜像：

```bash
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

如果 Windows 上遇到 `EBUSY` / `EPERM`（搜索索引器占用了中间目录），可把输出目录指到工作区外：

```bash
npx electron-builder --win portable --config.directories.output=../pvz-build
```

## 目录结构

```
.
├── server.js           # 零依赖 HTTP 服务：静态资源 + 词库/成绩 API
├── electron/main.js    # Electron 主进程：内嵌服务、窗口、单实例锁
├── public/
│   ├── index.html      # 页面结构（HUD、种子栏、答题面板）
│   ├── style.css       # 深绿玻璃拟态主题 + 响应式
│   └── game.js         # 游戏循环、僵尸/植物/答题/渲染/音效
├── data/words.json     # 3 关 × 30 词拼音词库
└── package.json        # 脚本与 electron-builder 配置
```

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/words` | 返回全部关卡词库 |
| GET | `/api/scores` | 返回最高分与成绩列表（前 10） |
| POST | `/api/score` | 提交成绩 `{ "score": 1234, "waves": 5 }` |

## 词库格式

编辑 `data/words.json` 即可扩充题目，`char` 为汉字，`pinyin` 为带声调的标准答案：

```json
{
  "levels": [
    {
      "id": 1,
      "name": "第一关 · 单韵母基础字",
      "words": [{ "char": "爸", "pinyin": "bà" }]
    }
  ]
}
```

## 技术栈

- **服务端**：Node.js 内置 `http` / `fs` / `path`，零第三方运行时依赖
- **前端**：原生 HTML / CSS / JavaScript，Canvas 2D 游戏循环，WebAudio 程序化音效
- **桌面版**：Electron 45 + electron-builder 26（portable 单文件）
- **数据**：JSON 词库与成绩文件，原子写入

## 声明

本项目为个人学习与亲子拼音练习用途的非官方作品，与 EA / PopCap 官方无关；不使用任何原作美术、音频素材。
