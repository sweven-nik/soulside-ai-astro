export function safeTag(value,fallback='div') { return typeof value==='string'&&/^[a-z][a-z0-9-]*$/i.test(value)?value:fallback; }

export function safeAttributes(value, excluded = []) { return Object.fromEntries(Object.entries(value||{}).filter(([name])=>/^[a-zA-Z_:][\w:.-]*$/.test(name)&&!/^on/i.test(name)&&!['set:html','set:text'].includes(name)&&!excluded.includes(name))); }

export function customAttributes(rows) { return safeAttributes(Object.fromEntries((rows||[]).filter(row=>row?.name).map(row=>[row.name,row.value]))); }
