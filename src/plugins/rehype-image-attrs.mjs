import { visit } from 'unist-util-visit';

// ![alt](src.png){width=70% align=center} 처럼 이미지 바로 뒤에 붙는 {..} 속성을 인식한다.
const ATTR_RE = /^\s*\{([^}]+)\}/;

function parseAttrs(raw) {
	const attrs = {};
	for (const token of raw.trim().split(/\s+/)) {
		const [key, value] = token.split('=');
		if (key && value) attrs[key] = value.replace(/^["']|["']$/g, '');
	}
	return attrs;
}

export default function rehypeImageAttrs() {
	return (tree) => {
		visit(tree, 'element', (node, index, parent) => {
			if (node.tagName !== 'img' || !parent || index == null) return;

			const sibling = parent.children[index + 1];
			if (!sibling || sibling.type !== 'text') return;

			const match = sibling.value.match(ATTR_RE);
			if (!match) return;

			const attrs = parseAttrs(match[1]);
			const styles = [];

			// Astro가 로컬 이미지의 width/height 속성은 자체적으로 다시 계산해 덮어쓰므로
			// style로만 크기를 지정해야 실제로 반영된다.
			if (attrs.width) styles.push(`width:${attrs.width}`, 'height:auto');
			if (attrs.height) styles.push(`height:${attrs.height}`);

			// float은 뒤따르는 텍스트가 이미지 옆으로 감싸 올라오게 만들어서
			// 의도한 정렬과 다르게 보이므로, block + margin auto로 텍스트 줄바꿈 없이 위치만 옮긴다.
			if (attrs.align === 'center') {
				styles.push('display:block', 'margin-inline:auto');
			} else if (attrs.align === 'left') {
				styles.push('display:block', 'margin-right:auto');
			} else if (attrs.align === 'right') {
				styles.push('display:block', 'margin-left:auto');
			}

			if (styles.length > 0) {
				const existing = node.properties.style ? `${node.properties.style};` : '';
				node.properties.style = existing + styles.join(';');
			}

			const rest = sibling.value.slice(match[0].length);
			if (rest.trim().length > 0) {
				sibling.value = rest;
			} else {
				parent.children.splice(index + 1, 1);
			}
		});
	};
}
