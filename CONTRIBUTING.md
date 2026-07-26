# Contributing / 贡献指南

1. Keep changes focused and explain whether they affect simulation only or a future real integration. / 保持改动聚焦，并说明影响仅限模拟还是真实接入。
2. Run `npm ci`, `npm run audit`, and `npm run build`. / 执行依赖安装、安全审计与生产构建。
3. Exercise affected interactions in a browser and update a real screenshot for visible UI changes. / 在浏览器验证受影响交互，界面变化时更新真实截图。
4. Keep Chinese and English documentation aligned. / 保持中英文文档同步。
5. Never commit credentials, real coordinates, private flight plans, captured imagery, or generated `dist/` output. / 不得提交凭据、真实坐标、私密航线、采集图像或 `dist/` 产物。

Real device or backend integrations must include a threat model, data contract, failure modes, authorization rules, and test strategy. / 真实设备或后端接入必须包含威胁模型、数据契约、故障模式、授权规则和测试策略。
