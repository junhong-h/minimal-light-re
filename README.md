# Personal Homepage

基于 [Minimal Light](https://github.com/yaoyao-liu/minimal-light) 主题改造的个人学术主页，使用 Jekyll 构建，部署在 GitHub Pages。

## 目录结构

```
.
├── _config.yml              # 站点配置：个人信息、社交链接、字体、深色模式开关
├── index.md                 # 主页正文：About / Research Interests / News
│
├── _data/                   # 结构化内容（只改数据，不用碰 HTML）
│   ├── publications.yml     #   论文列表
│   └── services.yml         #   学术服务
│
├── _layouts/
│   └── homepage.html        # 页面骨架：拼装下面的各个 include
├── _includes/               # 页面组件
│   ├── head.html            #   <head>：SEO、favicon、字体、样式、统计
│   ├── profile.html         #   左侧栏：头像、姓名、联系方式、社交图标
│   ├── publications.html    #   论文列表（读取 _data/publications.yml）
│   └── services.html        #   学术服务（读取 _data/services.yml）
│
├── _sass/                   # 样式模块
│   ├── _variables.scss      #   颜色变量（CSS 自定义属性）
│   ├── _base.scss           #   基础排版
│   ├── _layout.scss         #   两栏布局与响应式断点
│   ├── _profile.scss        #   侧边栏
│   ├── _publications.scss   #   论文列表
│   ├── _services.scss       #   学术服务
│   └── _dark.scss           #   深色模式（覆盖颜色变量）
│
├── assets/
│   ├── css/main.scss        # 样式唯一入口，按配置选择字体、是否引入深色模式
│   ├── js/favicon-switcher.js
│   ├── img/                 # 头像、favicon、论文配图
│   └── files/               # CV 等文件
│
├── Gemfile                  # 依赖（github-pages，与线上构建环境一致）
└── LICENSE
```

## 常见修改

| 想改什么 | 改哪里 |
|---|---|
| 姓名、职位、邮箱、社交链接 | `_config.yml` |
| About / 研究方向 / News | `index.md` |
| 论文 | `_data/publications.yml`，配图放 `assets/img/` |
| 学术服务 | `_data/services.yml` |
| 颜色 | `_sass/_variables.scss`（浅色）、`_sass/_dark.scss`（深色） |
| 字体 / 是否启用深色模式 | `_config.yml` 中的 `font`、`auto_dark_mode` |

## 本地预览

需要 Ruby 3.3（GitHub Pages 线上使用的版本）：

```bash
brew install ruby@3.3
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"

bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve
```

然后打开 <http://localhost:4000>。

## 部署

推送到名为 `<username>.github.io` 的仓库，并在仓库 Settings → Pages 中选择从 `main` 分支部署，即可通过 `https://<username>.github.io` 访问。

## License

主题来自 [yaoyao-liu/minimal-light](https://github.com/yaoyao-liu/minimal-light)，遵循其 [LICENSE](LICENSE)。
