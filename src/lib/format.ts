import { text } from './values';
const index = {"language": "en", "options": {}};

export function formatNumber(value,precision) { return Number.isFinite(Number(value)) ? Number(precision)<0 ? String(value) : Number(value).toFixed(Math.min(20,Math.max(0,Number(precision)||0))) : ''; }

export function formatDate(value,format) {
        const date = new Date(value); if (Number.isNaN(date.getTime())) return '';
        const pad=n=>String(n).padStart(2,'0'),hour=date.getUTCHours(),day=date.getUTCDate();
        const part=options=>new Intl.DateTimeFormat(index.language||'en',{...options,timeZone:'UTC'}).format(date);
        const tokens={YYYY:date.getUTCFullYear(),YY:String(date.getUTCFullYear()).slice(-2),MMMM:part({month:'long'}),MMM:part({month:'short'}),MM:pad(date.getUTCMonth()+1),M:date.getUTCMonth()+1,DD:pad(day),D:day,Do:day+([11,12,13].includes(day)?'th':{1:'st',2:'nd',3:'rd'}[day%10]||'th'),dddd:part({weekday:'long'}),ddd:part({weekday:'short'}),HH:pad(hour),H:hour,hh:pad(hour%12||12),h:hour%12||12,mm:pad(date.getUTCMinutes()),m:date.getUTCMinutes(),ss:pad(date.getUTCSeconds()),s:date.getUTCSeconds(),A:hour>=12?'PM':'AM',a:hour>=12?'pm':'am',Z:'+00:00'};
        return String(format||'MMMM D, YYYY').replace(/\[[^\]]*\]|YYYY|MMMM|dddd|MMM|ddd|YY|MM|DD|Do|HH|hh|mm|ss|[MDHhmsAaZ]/g,token=>token.startsWith('[')?token.slice(1,-1):String(tokens[token]));
    }

export function optionLabel(value) { return index.options?.[value] || text(value); }
