# 项目部署指南

本指南将帮助您将此Vue 3项目部署到公网上。

## 项目概述

- **项目类型**：纯前端Vue 3应用
- **构建工具**：Vite
- **构建输出**：静态文件（位于`dist`目录）

## 部署选项

### 1. 静态网站托管服务（推荐）

这些服务专为静态网站设计，操作简单且通常提供免费计划。

#### Vercel

1. **准备工作**：
   - 将项目上传到GitHub/GitLab/Bitbucket
   - 注册Vercel账号：https://vercel.com

2. **部署步骤**：
   - 登录Vercel，点击「New Project」
   - 选择您的项目仓库
   - 配置构建设置：cp package.json package.json.backup
     - Framework: `Vue.js`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - 点击「Deploy」
   - 部署完成后，Vercel会提供一个域名（如`your-project.vercel.app`）

#### Netlify

1. **准备工作**：
   - 将项目上传到GitHub/GitLab/Bitbucket
   - 注册Netlify账号：https://www.netlify.com

2. **部署步骤**：
   - 登录Netlify，点击「Add new site」→「Import an existing project」
   - 选择您的项目仓库
   - 配置构建设置：
     - Build command: `npm run build`
     - Publish directory: `dist`
   - 点击「Deploy site」
   - 部署完成后，Netlify会提供一个域名（如`your-project.netlify.app`）

#### GitHub Pages

1. **准备工作**：
   - 将项目上传到GitHub仓库

2. **部署步骤**：
   - 安装`gh-pages`包：`npm install --save-dev gh-pages`
   - 在`package.json`中添加部署脚本：
     ```json
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview",
       "deploy": "gh-pages -d dist"
     }
     ```
   - 构建项目：`npm run build`
   - 部署到GitHub Pages：`npm run deploy`
   - 访问：`https://your-username.github.io/your-repo-name`

### 2. 传统服务器部署

如果您有自己的服务器，可以使用以下方法部署：

#### Nginx部署

1. **准备工作**：
   - 拥有一台运行Linux的服务器
   - 安装Nginx

2. **部署步骤**：
   - 构建项目：`npm run build`
   - 将`dist`目录上传到服务器（例如使用`scp`命令）
   - 配置Nginx虚拟主机：
     ```nginx
     server {
       listen 80;
       server_name your-domain.com;
       
       root /path/to/your/dist;
       index index.html;
       
       location / {
         try_files $uri $uri/ /index.html;
       }
     }
     ```
   - 重启Nginx：`sudo systemctl restart nginx`
   - 访问：`http://your-domain.com`

#### Docker部署

1. **准备工作**：
   - 安装Docker

2. **创建Dockerfile**：
   ```dockerfile
   # 基础镜像
   FROM nginx:alpine
   
   # 复制构建文件到Nginx默认目录
   COPY dist/ /usr/share/nginx/html
   
   # 暴露80端口
   EXPOSE 80
   
   # 启动Nginx
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **构建和运行容器**：
   - 构建项目：`npm run build`
   - 构建Docker镜像：`docker build -t love-story-site .`
   - 运行容器：`docker run -d -p 80:80 --name love-story-site love-story-site`
   - 访问：`http://your-server-ip`

### 3. 云服务提供商

#### AWS S3 + CloudFront

1. **准备工作**：
   - 注册AWS账号

2. **部署步骤**：
   - 构建项目：`npm run build`
   - 创建S3存储桶，设置为静态网站托管
   - 上传`dist`目录内容到S3存储桶
   - 创建CloudFront分发，指向S3存储桶
   - 配置自定义域名（可选）

#### Google Cloud Storage + CDN

1. **准备工作**：
   - 注册Google Cloud账号

2. **部署步骤**：
   - 构建项目：`npm run build`
   - 创建Cloud Storage存储桶，设置为公共访问
   - 上传`dist`目录内容到存储桶
   - 配置CDN（可选）

## 环境变量配置

如果您的项目需要环境变量，可以：

1. 在`.env`文件中定义（开发环境）
2. 在部署平台的环境变量设置中配置（生产环境）

## 部署后验证

部署完成后，确保：
- 网站可以正常访问
- 所有资源（图片、CSS、JS）加载正常
- 路由功能正常（如果有）
- 响应式设计在不同设备上正常显示

## 持续部署

对于频繁更新的项目，建议设置持续部署：
- Vercel/Netlify：自动检测仓库更新并部署
- GitHub Actions：配置CI/CD工作流

## 常见问题

### 404错误
- 确保服务器配置了回退到`index.html`（对于SPA应用）
- 检查路由配置

### 资源加载失败
- 检查资源路径是否正确
- 确保构建时使用了正确的公共路径

### 性能优化
- 启用CDN加速
- 压缩静态资源
- 配置浏览器缓存

## 总结

对于此Vue 3项目，推荐使用静态网站托管服务（如Vercel或Netlify），它们操作简单、速度快且提供免费计划，非常适合纯前端应用。

如果您需要更多自定义配置或已有服务器资源，可以选择传统服务器部署或云服务提供商方案。