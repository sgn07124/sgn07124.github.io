// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog'
import sitemap from '@astrojs/sitemap';


const CONTENT_ROOT = './src/content/docs';

function buildLastModMap() {
	const map = new Map();
	const walk = (dir, urlBase) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			
			// 1. 만약 폴더(Directory)라면? 폴더 안으로 더 깊숙이 파고들어갑니다. (재귀 함수)
			if (entry.isDirectory()) {
				walk(full, urlBase + '/' + entry.name);
				continue;
			}
			
			// 2. 확장자가 .md 나 .mdx 가 아니라면 건너뜁니다. (마크다운 파일만 추출)
			if (!/\.mdx?$/.test(entry.name)) continue;

			// 3. 마크다운 파일 내용을 텍스트로 읽어옵니다.
			const raw = fs.readFileSync(full, 'utf-8');
			
			// 4. 정규표현식을 사용해 맨 위의 Frontmatter(--- 와 --- 사이의 설정값)를 찾습니다.
			const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
			if (!fmMatch) continue;
			
			// 5. 설정값 중에서 `lastUpdated: 2026-05-30` 같은 문장을 찾습니다.
			const lu = fmMatch[1].match(/^lastUpdated:\s*(.+)$/m);
			if (!lu) continue;
			
			// 6. 따옴표를 지우고 순수한 날짜 텍스트만 추출해서 JavaScript Date 객체로 변환합니다.
			const dateStr = lu[1].trim().replace(/^['"]|['"]$/g, '');
			const date = new Date(dateStr);
			if (isNaN(date.getTime())) continue; // 날짜 형식이 깨져있으면 패스

			// 7. 파일 이름(예: cpu.md -> cpu)을 가지고 실제 인터넷 웹사이트 주소(Pathname)를 계산합니다.
			const stem = entry.name.replace(/\.mdx?$/, '');
			const pathname = stem === 'index' ? urlBase + '/' : urlBase + '/' + stem + '/';
			
			// 8. 지도(Map)에 기록합니다. 예시 => [ '/docs/computer-architecture/cpu/' : '2026-05-31T00:00:00Z' ]
			map.set(pathname || '/', date.toISOString());
		}
	};
	walk(CONTENT_ROOT, '');
	return map;
}

const lastModMap = buildLastModMap();

// https://astro.build/config
export default defineConfig({
    integrations: [
		starlight({
			title: 'vlow.log',
			description: 'Backend Engineer, Java & Spring',
			defaultLocale: 'root',
			locales: {
				root: { label: '한국어', lang: 'ko' }
			},
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/sgn07124' }],
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css',
					},
				},
				{
					tag: 'script',
					content: `(function(){if(window.location.pathname.startsWith('/blog')){document.documentElement.setAttribute('data-no-sidebar','');document.documentElement.removeAttribute('data-has-sidebar');}})();`,
				},
				{
					tag: 'script',
					attrs: { type: 'module' },
					content: [
						`import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';`,
						`const getTheme = () => document.documentElement.dataset.theme === 'light' ? 'default' : 'dark';`,
						`mermaid.initialize({ startOnLoad: false, theme: getTheme() });`,
						`async function renderMermaid() {`,
						`  const blocks = document.querySelectorAll('pre[data-language="mermaid"] code');`,
						`  for (const code of blocks) {`,
						`    const ecLines = code.querySelectorAll('.ec-line');`,
						`    const source = ecLines.length > 0`,
						`      ? Array.from(ecLines).map(l => (l.textContent || '').replace(/\\n$/, '')).join('\\n').trim()`,
						`      : (code.textContent || '').trim();`,
						`    if (!source) continue;`,
						`    const wrapper = document.createElement('div');`,
						`    wrapper.className = 'mermaid-diagram not-content';`,
						`    wrapper.dataset.mermaidSource = source;`,
						`    wrapper.style.cssText = 'overflow-x:auto;padding:1rem;text-align:center;';`,
						`    try {`,
						`      const { svg } = await mermaid.render('mermaid-' + Math.random().toString(36).slice(2), source);`,
						`      wrapper.innerHTML = svg;`,
						`      const pre = code.closest('pre');`,
						`      const expressive = pre && pre.closest('.expressive-code');`,
						`      if (expressive) {`,
						`        expressive.querySelectorAll('link[rel="stylesheet"], script[src]').forEach(el => document.head.appendChild(el));`,
						`      }`,
						`      (expressive || pre).replaceWith(wrapper);`,
						`    } catch (e) { console.error('Mermaid render error:', e); }`,
						`  }`,
						`}`,
						`async function reRenderMermaid() {`,
						`  const wrappers = document.querySelectorAll('.mermaid-diagram');`,
						`  for (const wrapper of wrappers) {`,
						`    const source = wrapper.dataset.mermaidSource;`,
						`    if (!source) continue;`,
						`    try {`,
						`      const { svg } = await mermaid.render('mermaid-' + Math.random().toString(36).slice(2), source);`,
						`      wrapper.innerHTML = svg;`,
						`    } catch (e) { console.error('Mermaid re-render error:', e); }`,
						`  }`,
						`}`,
						`const observer = new MutationObserver((mutations) => {`,
						`  for (const mutation of mutations) {`,
						`    if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {`,
						`      mermaid.initialize({ startOnLoad: false, theme: getTheme() });`,
						`      reRenderMermaid();`,
						`    }`,
						`  }`,
						`});`,
						`observer.observe(document.documentElement, { attributes: true });`,
						`renderMermaid();`,
					].join('\n'),
				},
			],
			plugins: [
				starlightBlog({
					title: 'Blog',
					postCount: 5,
					recentPostCount: 10,
					navigation: 'none',
					authors: {
						vlow: {
							name: 'sgn07124',
							title: 'Backend Engineer',
							url: 'https://github.com/sgn07124'
						}
					}
				})
			],
			sidebar: [
				{
					label: 'Computer Architecture',
					items: [{ autogenerate: { "directory": "docs/computer-architecture", "collapsed": true } }]
				},
				{
					label: 'Operating System',
					items: [{ autogenerate: { "directory": "docs/operating-system", "collapsed": true } }]
				},
				{
					label: 'Network',
					items: [{ autogenerate: { "directory": "docs/network", "collapsed": true } }]
				},
				{
					label: 'Java',
					items: [{ autogenerate: { "directory": "docs/java", "collapsed": true } }]
				},
				{
					label: 'Spring',
					items: [{ autogenerate: { "directory": "docs/spring", "collapsed": true } }]
				},
				{
					label: 'Database',
					items: [{ autogenerate: { "directory": "docs/database", "collapsed": true } }]
				},
				{
					label: 'Large-Scale System',
					items: [{ autogenerate: { "directory": "docs/large-scale-system", "collapsed": true } }]
				},
				{
					label: 'System Architecture',
					items: [{ autogenerate: { "directory": "docs/system-architecture", "collapsed": true } }]
				},
				{
					label: 'AI-Assisted Development',
					items: [{ autogenerate: { "directory": "docs/ai-assisted-development", "collapsed": true } }]
				},
				{
					label: 'Setting',
					items: [{ autogenerate: { "directory": "docs/setting", "collapsed": true } }]
				},
			],
			components: {
				Head: './src/components/Head.astro',
				Footer: './src/components/Footer.astro',
				Header: './src/components/Header.astro',
				MobileMenuFooter: './src/components/MobileMenuFooter.astro',
				Sidebar: './src/components/Sidebar.astro',
				PageTitle: './src/components/PageTitle.astro',
				Pagination: './src/components/Pagination.astro',
				SocialIcons: './src/components/SocialIcons.astro',
				SiteTitle: './src/components/SiteTitle.astro',
			},
			customCss: ['./src/styles/custom.css'],
		}), 
		sitemap({
			serialize(item) {
				const pathname = new URL(item.url).pathname;
				const lastmod = lastModMap.get(pathname);
				if (lastmod) item.lastmod = lastmod;
				return item;
			},
		}),
	],
});