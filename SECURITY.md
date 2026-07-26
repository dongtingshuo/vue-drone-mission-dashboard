# Security and Safety Policy / 安全策略

## Scope / 范围

Security fixes target the latest `main` revision. The current application is a frontend simulation: it has no authentication, backend, real telemetry link, AI inference service, or aircraft command channel. / 安全修复面向 `main` 最新版本。当前应用是前端模拟，不包含身份认证、后端、真实遥测链路、AI 推理服务或飞行器指令通道。

Do not use this prototype to operate an aircraft or make safety-critical decisions. A production integration requires threat modelling, authenticated and encrypted transport, least-privilege authorization, command confirmation, replay protection, telemetry validation, rate limiting, geofencing, link-loss behavior, audit logging, secrets management, and independent safety review. / 不得使用本原型控制飞行器或作出安全关键决策。生产接入必须完成威胁建模、认证加密传输、最小权限授权、指令确认、防重放、遥测校验、限流、地理围栏、失联保护、审计日志、密钥管理和独立安全评审。

## Reporting / 报告

Use GitHub private vulnerability reporting when available. Otherwise, open a minimal issue requesting a secure contact channel without publishing exploit details, credentials, coordinates, flight plans, or captured imagery. / 请优先使用 GitHub 私密漏洞报告；若不可用，请创建最小公开 Issue 请求安全联系方式，不得公开漏洞细节、凭据、坐标、航线或采集图像。

Include the affected revision, browser/OS, reproduction steps, impact, and sanitized evidence. / 请提供受影响版本、浏览器/操作系统、复现步骤、影响与脱敏证据。
