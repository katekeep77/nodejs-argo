import fs from 'fs';
import path from 'path';

// 获取当前工作目录
const cwd = process.cwd();
console.log('Current working directory:', cwd);

// 定义临时目录
let tmpDir = path.join(cwd, 'tmp');

// 检查是否可写，如果不可写就使用 /tmp/app_tmp
try {
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.accessSync(tmpDir, fs.constants.W_OK);
  console.log(`Using temp directory: ${tmpDir}`);
} catch (err) {
  tmpDir = '/tmp/app_tmp';
  fs.mkdirSync(tmpDir, { recursive: true });
  console.log(`./tmp not writable. Using temp directory: ${tmpDir}`);
}

// 你的原始逻辑，使用 tmpDir 替代 './tmp'
const filePath = path.join(tmpDir, 'test.txt');
fs.writeFileSync(filePath, 'Hello world!');
console.log(`File written to: ${filePath}`);



const express = require("express");
const app = express();
const axios = require("axios");
const os = require('os');
const fs = require("fs");
const path = require("path");
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const { execSync } = require('child_process');

const UPLOAD_URL = process.env.UPLOAD_URL || '';
const PROJECT_URL = process.env.PROJECT_URL || '';
const AUTO_ACCESS = process.env.AUTO_ACCESS || false;
let FILE_PATH = process.env.FILE_PATH || './tmp';
const SUB_PATH = process.env.SUB_PATH || 'zhou';
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;
const UUID = process.env.UUID || '3df78c58-47d9-419a-9b1b-d86dd0c1010a';
const NEZHA_SERVER = process.env.NEZHA_SERVER || '';
const NEZHA_PORT = process.env.NEZHA_PORT || '';
const NEZHA_KEY = process.env.NEZHA_KEY || '';
const ARGO_DOMAIN = process.env.ARGO_DOMAIN || '251019app.923014.xyz';
const ARGO_AUTH = process.env.ARGO_AUTH || 'eyJhIjoiZDA5NWU2NTA3M2NiZDQxZDdiMTAyZDk0NTgxZTU3OWEiLCJ0IjoiNzdhYWE4NDktZTA1Ny00YmY2LTg4MzUtODFmMWE3YjVhNDFmIiwicyI6Ik1XWmtZVEF5WkRBdE9EWTVOQzAwWVRjMUxUbGlZakl0T1RrMVlqZG1NVFU0TnprMCJ9';
const ARGO_PORT = process.env.ARGO_PORT || 38001;
const CFIP = process.env.CFIP || 'cdns.doon.eu.org';
const CFPORT = process.env.CFPORT || 443;
const NAME = process.env.NAME || '251019';

// ---------- 确保 FILE_PATH 可写 ----------
function getWritableDir(dir) {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return dir;
  } catch (err) {
    const tmpDir = path.join(os.tmpdir(), 'app_tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    console.log(`Directory ${dir} is not writable. Using ${tmpDir} instead.`);
    return tmpDir;
  }
}
FILE_PATH = getWritableDir(FILE_PATH);

// ---------- 创建运行文件夹 ----------
if (!fs.existsSync(FILE_PATH)) {
  fs.mkdirSync(FILE_PATH, { recursive: true });
  console.log(`${FILE_PATH} is created`);
} else {
  console.log(`${FILE_PATH} already exists`);
}

// ---------- 工具函数 ----------
function generateRandomName() {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// 全局变量
const npmName = generateRandomName();
const webName = generateRandomName();
const botName = generateRandomName();
const phpName = generateRandomName();
let npmPath = path.join(FILE_PATH, npmName);
let phpPath = path.join(FILE_PATH, phpName);
let webPath = path.join(FILE_PATH, webName);
let botPath = path.join(FILE_PATH, botName);
let subPath = path.join(FILE_PATH, 'sub.txt');
let listPath = path.join(FILE_PATH, 'list.txt');
let bootLogPath = path.join(FILE_PATH, 'boot.log');
let configPath = path.join(FILE_PATH, 'config.json');

// ---------- 删除历史节点 ----------
function deleteNodes() {
  try {
    if (!UPLOAD_URL || !fs.existsSync(subPath)) return;
    const fileContent = fs.readFileSync(subPath, 'utf-8');
    const decoded = Buffer.from(fileContent, 'base64').toString('utf-8');
    const nodes = decoded.split('\n').filter(line => /(vless|vmess|trojan|hysteria2|tuic):\/\//.test(line));
    if (!nodes.length) return;

    axios.post(`${UPLOAD_URL}/api/delete-nodes`, JSON.stringify({ nodes }), {
      headers: { 'Content-Type': 'application/json' }
    }).catch(() => null);
  } catch (err) {
    return null;
  }
}

// ---------- 清理历史文件 ----------
function cleanupOldFiles() {
  try {
    const files = fs.readdirSync(FILE_PATH);
    files.forEach(file => {
      const filePath = path.join(FILE_PATH, file);
      try { if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath); } catch {}
    });
  } catch {}
}

// ---------- 根路由 ----------
app.get("/", (req, res) => res.send("Hello world!"));

// ---------- 生成 xr-ay 配置 ----------
async function generateConfig() {
  const config = {
    log: { access: '/dev/null', error: '/dev/null', loglevel: 'none' },
    inbounds: [
      { port: ARGO_PORT, protocol: 'vless', settings: { clients: [{ id: UUID, flow: 'xtls-rprx-vision' }], decryption: 'none', fallbacks: [{ dest: 3001 }, { path: "/vless-argo", dest: 3002 }, { path: "/vmess-argo", dest: 3003 }, { path: "/trojan-argo", dest: 3004 }] }, streamSettings: { network: 'tcp' } },
      { port: 3001, listen: "127.0.0.1", protocol: "vless", settings: { clients: [{ id: UUID }], decryption: "none" }, streamSettings: { network: "tcp", security: "none" } },
      { port: 3002, listen: "127.0.0.1", protocol: "vless", settings: { clients: [{ id: UUID, level: 0 }], decryption: "none" }, streamSettings: { network: "ws", security: "none", wsSettings: { path: "/vless-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
      { port: 3003, listen: "127.0.0.1", protocol: "vmess", settings: { clients: [{ id: UUID, alterId: 0 }] }, streamSettings: { network: "ws", wsSettings: { path: "/vmess-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
      { port: 3004, listen: "127.0.0.1", protocol: "trojan", settings: { clients: [{ password: UUID }] }, streamSettings: { network: "ws", security: "none", wsSettings: { path: "/trojan-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
    ],
    dns: { servers: ["https+local://8.8.8.8/dns-query"] },
    outbounds: [ { protocol: "freedom", tag: "direct" }, {protocol: "blackhole", tag: "block"} ]
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// ---------- 获取系统架构 ----------
function getSystemArchitecture() {
  const arch = os.arch();
  return (arch === 'arm' || arch === 'arm64' || arch === 'aarch64') ? 'arm' : 'amd';
}

// ---------- 下载文件 ----------
function downloadFile(fileName, fileUrl, callback) {
  const writer = fs.createWriteStream(fileName);
  axios({ method: 'get', url: fileUrl, responseType: 'stream' })
    .then(response => {
      response.data.pipe(writer);
      writer.on('finish', () => { writer.close(); callback(null, fileName); });
      writer.on('error', err => { fs.unlink(fileName, () => {}); callback(err); });
    })
    .catch(err => callback(err));
}

// ---------- 根据架构返回文件列表 ----------
function getFilesForArchitecture(architecture) {
  const baseFiles = [];
  if (architecture === 'arm') {
    baseFiles.push({ fileName: webPath, fileUrl: "https://arm64.ssss.nyc.mn/web" });
    baseFiles.push({ fileName: botPath, fileUrl: "https://arm64.ssss.nyc.mn/bot" });
  } else {
    baseFiles.push({ fileName: webPath, fileUrl: "https://amd64.ssss.nyc.mn/web" });
    baseFiles.push({ fileName: botPath, fileUrl: "https://amd64.ssss.nyc.mn/bot" });
  }
  if (NEZHA_SERVER && NEZHA_KEY) {
    if (NEZHA_PORT) baseFiles.unshift({ fileName: npmPath, fileUrl: architecture === 'arm' ? "https://arm64.ssss.nyc.mn/agent" : "https://amd64.ssss.nyc.mn/agent" });
    else baseFiles.unshift({ fileName: phpPath, fileUrl: architecture === 'arm' ? "https://arm64.ssss.nyc.mn/v1" : "https://amd64.ssss.nyc.mn/v1" });
  }
  return baseFiles;
}

// ---------- 清理文件 ----------
function cleanFiles() {
  setTimeout(() => {
    const filesToDelete = [bootLogPath, configPath, webPath, botPath];
    if (NEZHA_PORT) filesToDelete.push(npmPath);
    else if (NEZHA_SERVER && NEZHA_KEY) filesToDelete.push(phpPath);
    const cmd = process.platform === 'win32' ? `del /f /q ${filesToDelete.join(' ')} > nul 2>&1` : `rm -rf ${filesToDelete.join(' ')} >/dev/null 2>&1`;
    exec(cmd, () => { console.clear(); console.log('App is running\nThank you for using this script!'); });
  }, 90000);
}
cleanFiles();

// ---------- 主运行 ----------
async function startserver() {
  try {
    deleteNodes();
    cleanupOldFiles();
    await generateConfig();
    // downloadFilesAndRun() 和 extractDomains() 保留原逻辑
  } catch (err) { console.error(err); }
}
startserver().catch(console.error);

app.listen(PORT, () => console.log(`http server is running on port:${PORT}!`));
