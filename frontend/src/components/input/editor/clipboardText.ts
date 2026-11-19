import type {Fragment, Node as ProseMirrorNode} from '@tiptap/pm/model'

/**
 * Plain-text output for copying from the editor. ProseMirror's default drops list
 * markers, so a copied bullet list would paste as bare lines. Lists keep their markers
 * here; everything else falls back to its text.
 */
export function serializeToPlainText(fragment: Fragment): string {
	return blockLines(fragment).join('\n')
}

function blockLines(fragment: Fragment): string[] {
	const lines: string[] = []
	fragment.forEach(node => {
		lines.push(...nodeLines(node))
	})
	return lines
}

function nodeLines(node: ProseMirrorNode): string[] {
	switch (node.type.name) {
		case 'bulletList':
			return listLines(node, () => '- ')
		case 'orderedList': {
			const start = Number(node.attrs.start ?? 1)
			return listLines(node, index => `${start + index}. `)
		}
		case 'taskList':
			return listLines(node, (item) => item.attrs.checked ? '- [x] ' : '- [ ] ')
	}

	if (node.isTextblock) {
		return [node.textBetween(0, node.content.size, undefined, '\n')]
	}

	if (node.isLeaf) {
		return []
	}

	return blockLines(node.content)
}

function listLines(list: ProseMirrorNode, markerFor: (item: ProseMirrorNode, index: number) => string): string[] {
	const lines: string[] = []

	list.forEach((item, _offset, index) => {
		const marker = markerFor(item, index)
		const indent = ' '.repeat(marker.length)
		blockLines(item.content).forEach((line, lineIndex) => {
			lines.push(lineIndex === 0 ? marker + line : indent + line)
		})
	})

	return lines
}
