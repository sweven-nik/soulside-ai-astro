import { fieldValue } from './content-references';
import { text, hasValue } from './values';
import { formatDate, formatNumber, optionLabel } from './format';
export function evaluate(expr, scope = {}) {
      if (expr == null || typeof expr !== 'object') return expr;
      if (Array.isArray(expr)) return expr.map(x => evaluate(x, scope));
      switch (expr.type) {
        case 'Text': case 'Enum': case 'Number': case 'Boolean': case 'Bool': return expr.val;
        case 'Distinct': return evaluate(expr.val?.value, scope);
        case 'Literal': return expr.val?.value;
        case 'Union': return expr.val?.tag === 'True' ? true : expr.val?.tag === 'False' ? false : evaluate(expr.val?.value, scope);
        case 'Record': return Object.fromEntries(Object.entries(expr.val || {}).map(([k,v])=>[k,evaluate(v,scope)]));
        case 'List': return (expr.val || []).map(x => evaluate(x,scope));
        case 'Function': return evaluate(expr.val.body, scope);
        case 'Variable': return Array.isArray(expr.val) ? nativeFunction(expr.val) : scope[expr.val];
        case 'Select': return fieldValue(evaluate(expr.val.from,scope),expr.val.prop);
        case 'Call': { const fn=evaluate(expr.val.fun||expr.val.fn,scope);return typeof fn==='function'?fn(evaluate(expr.val.arg,scope)):evaluate(expr.val.fallback,scope); }
        case 'Element': return {children: evaluate(expr.val.data,expr._scope||scope)};
        default: return expr;
      }
    }

export function nativeFunction(path) {
      const name = path.join('/'), leaf = path[1];
      if (name === 'Conditions/Apply predicate') return value => predicate => typeof predicate === 'function' ? predicate(value) : true;
      if (name === 'Conditionals/Conditional') return value => value.rules?.find(rule => rule.condition)?.output ?? value.fallback;
      if (name === 'Boolean/Every') return value => value.every(Boolean);
      if (name === 'Boolean/Some') return value => value.some(Boolean);
      if (name === 'Boolean/Not') return value => !value;
      if (/booleanToVisibilityConditions|dynamoBooleanToVisibilityConditions/.test(leaf)) return value => [!!value];
      if (/Condition$|Operand$/.test(leaf)) return value => value;
      if (/IsNotSet$|isNotSet$|Is not set$/.test(leaf)) return value => !hasValue(value);
      if (/IsSet$|isSet$|Is set$/.test(leaf)) return value => hasValue(value);
      if (/DoesNotEqual$/.test(leaf)) return expected => value => value !== expected;
      if (/Equals$/.test(leaf)) return expected => value => value === expected;
      if (/styleVariantIsNotAny/.test(leaf)) return expected => value => !expected.includes(value);
      if (/styleVariantIsAny/.test(leaf)) return expected => value => expected.includes(value);
      if (name === 'List/Append') return a => b => [...(a || []), ...(b || [])];
      if (/RichTextToRichTextChildren$/.test(leaf)) return value => ({__html: value || ''});
      if (/OptionTo/.test(leaf)) return value => optionLabel(value);
      if (/Date(?:Time)?To/.test(leaf)) return format => value => formatDate(value,format);
      if (name==='Builtin/numberToText'||name==='Builtin/numberToListOfElements') return precision => value => formatNumber(value,precision);
      if (/ToListOfElements$|ToText$|numberToText|listOfElementsToText|To Text$/.test(leaf)) return value => text(value);
      if (/ToImage$/.test(leaf)) return value => value;
      if (/ToBasicLink$/.test(leaf)) return value => ({url: /Email/.test(leaf) ? 'mailto:' + text(value) : /Phone/.test(leaf) ? 'tel:' + text(value) : text(value)});
      return undefined;
    }
