# 国内公网部署指南

本项目是 Vue 3 + Vite 的纯静态站点，生产文件由 `npm run build` 输出到 `dist/`。要在中国大陆公网稳定访问，优先选择以下两种方式：

1. 国内云服务器 + Nginx
2. 阿里云 OSS / 腾讯云 COS 静态网站托管

> 如果绑定中国大陆备案域名，需要先完成 ICP 备案。没有备案域名时，可以先用云服务器公网 IP 临时访问。

## 方式一：国内云服务器 + Nginx

适合已经有阿里云 ECS、腾讯云 CVM、华为云 ECS 等服务器的情况。

### 服务器准备

服务器需要：

- 公网 IP
- 22 端口 SSH 可登录
- 安全组放行 80 端口；如启用 HTTPS，再放行 443 端口
- 已安装 Nginx

Ubuntu / Debian 安装示例：

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

### 上传站点

在本机运行：

```powershell
.\scripts\deploy-server.ps1 -ServerHost "你的服务器公网IP" -User "root" -RemotePath "/var/www/love-ocean"
```

如果 SSH 使用非默认端口：

```powershell
.\scripts\deploy-server.ps1 -ServerHost "你的服务器公网IP" -User "root" -Port 2222 -RemotePath "/var/www/love-ocean"
```

### Nginx 配置

在服务器创建 `/etc/nginx/sites-available/love-ocean`：

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/love-ocean;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
sudo ln -sf /etc/nginx/sites-available/love-ocean /etc/nginx/sites-enabled/love-ocean
sudo nginx -t
sudo systemctl reload nginx
```

访问：

```text
http://你的服务器公网IP/
```

## 方式二：阿里云 OSS 静态网站托管

适合只托管静态文件、不想维护服务器的情况。

基本步骤：

1. 创建 OSS Bucket，地域选择中国大陆。
2. 上传 `dist/` 目录内的全部文件。
3. 开启静态网站托管，首页设置为 `index.html`。
4. 如需自定义域名，先完成备案，再在 OSS 绑定域名并配置 CNAME。
5. 如页面刷新出现 404，将错误页也设置为 `index.html`。

## 方式三：腾讯云 COS 静态网站托管

基本步骤：

1. 创建 COS 存储桶，地域选择中国大陆。
2. 上传 `dist/` 目录内的全部文件。
3. 开启静态网站功能，索引文档设置为 `index.html`。
4. 如需自定义域名，先完成备案，再绑定域名并配置 CNAME。
5. 如页面刷新出现 404，将错误文档设置为 `index.html`。

## 当前项目构建命令

```powershell
npm install
npm run build
```

构建成功后，发布目录为：

```text
D:\codex\web\dist
```

## 我需要你提供什么才能直接发布

如果选择云服务器：

- 服务器公网 IP
- SSH 用户名
- SSH 端口
- 登录方式：本机已有密钥，或你提供临时密码/密钥

如果选择 OSS/COS：

- 云厂商：阿里云或腾讯云
- Bucket 名称和地域
- 可上传静态文件的临时 AccessKey / SecretKey，或让我在你已登录的 CLI 环境里执行

如果需要域名访问：

- 域名
- 是否已完成 ICP 备案
- DNS 是否能由你修改
