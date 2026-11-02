# Personal Homepage

基于 [Minimal Light](https://github.com/yaoyao-liu/minimal-light) 改造的个人学术主页：双栏布局、Source Serif 字体、跟随系统的深色模式（电脑端右上角拉绳可手动切换），使用 Jekyll 构建，部署在 GitHub Pages。

## 改内容：只需要动这些文件

| 想改什么 | 文件 |
|---|---|
| 姓名、职位、单位、邮箱、侧栏链接、章节顺序 | `_config.yml` |
| About me 正文 | `index.md` |
| News | `_data/news.yml` |
| 论文（含配图、主题筛选、BibTeX） | `_data/publications.yml`，配图放 `assets/img/` |
| 学术服务 / 教学 | `_data/services.yml` |
| Beyond Research（爱好、照片） | `_data/beyond.yml` |
| 头像、CV | `assets/img/avatar.png`、`assets/files/curriculum_vitae.pdf` |

每个数据文件开头都有字段说明。页面上显示的文字一律使用英文。

## 目录结构

```
.
├── _config.yml                 # 站点配置
├── index.md                    # About me 正文
├── _data/                      # 内容数据
│   ├── news.yml
│   ├── publications.yml
│   ├── services.yml
│   └── beyond.yml
├── _layouts/homepage.html      # 页面骨架：侧栏 + 各章节 + 页脚
├── _includes/
│   ├── head.html               # <head>：SEO、favicon、字体、样式、统计
│   ├── sidebar.html            # 侧栏：个人信息 + 章节导航
│   ├── footer.html             # 页脚：最后更新时间（自动取构建时间，链接到对应 commit）
│   ├── theme-toggle.html       # 拉绳主题开关
│   └── sections/               # 各章节，文件名与 _config.yml 中 sections 的 id 对应
│       ├── news.html
│       ├── publications.html
│       ├── services.html
│       └── beyond.html
├── _sass/                      # 样式模块
│   ├── _variables.scss         # 颜色变量、断点
│   ├── _dark.scss              # 深色模式配色
│   ├── _base.scss              # 基础排版
│   ├── _layout.scss            # 双栏骨架、章节、页脚、响应式
│   ├── _sidebar.scss           # 侧栏与导航
│   ├── _news.scss
│   ├── _publications.scss
│   ├── _services.scss
│   ├── _beyond.scss
│   └── _overlays.scss          # 配图全屏查看、拉绳开关
├── assets/
│   ├── css/main.scss           # 样式入口
│   ├── js/main.js              # 交互：主题、导航、News 折叠、筛选、BibTeX 复制、看大图
│   ├── js/favicon-switcher.js
│   ├── img/
│   └── files/
└── Gemfile                     # github-pages，与线上构建环境一致
```

## 增加一个章节

1. 在 `_includes/sections/` 下新建 `<id>.html`（可参考 `services.html`）。
2. 在 `_config.yml` 的 `sections` 中加入 `- id: <id>` 和 `title: ...`，导航会自动出现。

## 本地预览

需要 Ruby 3.3（GitHub Pages 线上使用的版本）：

```bash
brew install ruby@3.3
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"

bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve --livereload
```

打开 <http://localhost:4000>，修改文件后浏览器会自动刷新；修改 `_config.yml` 需要重启服务。

## 部署

仓库命名为 `<username>.github.io`，在 Settings → Pages 中选择从 `main` 分支部署。每次 push 后约一两分钟生效，页脚的 "Last updated" 会自动更新为构建日期（按 `_config.yml` 中的 `timezone` 计算）。

## License

主题来自 [yaoyao-liu/minimal-light](https://github.com/yaoyao-liu/minimal-light)，遵循其 [LICENSE](LICENSE)。
