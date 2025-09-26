import React, { useEffect, useMemo, useState } from 'react';
import { SaveFile } from '../../wailsjs/go/main/App';

export type FileViewerSimplifiedProps = {
  path?: string | null | undefined;
  content: string | null | undefined;
  className?: string;
  onSaved?: () => void;
};

type NewItem = { name: string; value: string };

// Normalize text newlines and escaped sequences similar to Advanced view
const normalizeText = (input: string): string => {
  let text = String(input ?? '');
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.replace(/\\r\\n/g, '\n').replace(/\\r/g, '\n').replace(/\\n/g, '\n');
  return text;
};

// Collect all regex matches with submatches (1=name, 3=value)
function findAll(content: string, re: RegExp): RegExpExecArray[] {
  const out: RegExpExecArray[] = [];
  if (!re.global) re = new RegExp(re.source, `${re.ignoreCase ? 'i' : ''}${re.multiline ? 'm' : ''}g`);
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m[0] === '') re.lastIndex++;
    out.push(m);
  }
  return out;
}

export default function FileViewerSimplified({ path, content, className, onSaved }: FileViewerSimplifiedProps) {
  const cacheKey = (p: string) => `hyprsettings:draft:${p}`;
  const normalized = useMemo(() => {
    let base = content ?? '';
    if (path) {
      try {
        const cached = localStorage.getItem(cacheKey(path));
        if (cached != null && cached !== '') {
          base = cached;
        } else if (cached === '') {
          try { localStorage.removeItem(cacheKey(path)); } catch (e2) {}
        }
      } catch (e) {
        // ignore cache errors
      }
    }
    return normalizeText(base);
  }, [content, path]);

  // Define specs and compute sections with matches only
  const sections = useMemo(() => {
    const c = normalized;

        // ======== Specs ========
        // WARNING: This is a list of regexes stopped when a `#` is found.
        // ======== End ==========
    const specs: { key: string; title: string; re: RegExp }[] = [
      { key: 'variables',  title: 'Variables',          re: /(\$\w+)\s*(=)\s*([^#\n]*)/g },
      { key: 'mainmod',    title: 'Main Mod',        re: /(\$mainMod)\s*(=)\s*([^#\n]*)/gi },
      { key: 'env',        title: 'Environment',          re: /(env)\s*(=)\s*([^#\n]*)/gim },
      { key: 'layerrule',  title: 'Layer rules',    re: /(layerrule)\s*(=)\s*([^#\n]*)/gim },
      { key: 'execonce',   title: 'Exec once',      re: /(exec-once)\s*(=)\s*([^#\n]*)/gim },
      { key: 'bind',       title: 'Binds',              re: /(bind[a-zA-Z]*)\s*(=)\s*([^#\n]*)/g },
      { key: 'windowrule', title: 'Window rules', re: /(windowrule[^\s]*)\s*(=)\s*([^#\n]*)/gim },
    ];

    return specs
      .map(s => ({ key: s.key, title: s.title, re: s.re, items: findAll(c, s.re) }))
      .filter(s => s.items.length > 0);
  }, [normalized]);

  // Build initial values map keyed by section+index (stable within content)
  const buildInitialValues = () => {
    const map: Record<string, string> = {};
    sections.forEach(sec => {
      sec.items.forEach((m, idx) => {
        const id = `${sec.key}:${idx}`;
        map[id] = (m[3] ?? '').trim();
      });
    });
    return map;
  };

  const [values, setValues] = useState<Record<string, string>>(() => buildInitialValues());
  const [added, setAdded] = useState<Record<string, NewItem[]>>({});
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset values when content changes
  useEffect(() => {
    setValues(buildInitialValues());
    setAdded({});
    setInfo(null);
    setError(null);
  }, [normalized]);

  const appendNewItems = (out: string): string => {
    const newLines: string[] = [];
    Object.entries(added).forEach(([secKey, items]) => {
      items.forEach((it) => {
        const name = (it.name ?? '').trim();
        const value = (it.value ?? '').trim();
        if (name && value) newLines.push(`${name} = ${value}`);
      });
    });
    if (newLines.length === 0) return out;
    if (!out.endsWith('\n')) out += '\n';
    out += newLines.join('\n') + '\n';
    return out;
  };

  const handleSave = async () => {
    if (!path) return;
    setSaving(true);
    setInfo(null);
    setError(null);

    try {
      let out = normalized;
      sections.forEach(sec => {
        let i = 0;
        const re = new RegExp(sec.re.source, `${sec.re.ignoreCase ? 'i' : ''}${sec.re.multiline ? 'm' : ''}g`);
        out = out.replace(re, (...args: any[]) => {
          // args: match, g1, g2, g3, offset, string, groups
          const g1 = args[1] ?? '';
          const g2 = args[2] ?? '=';
          const g3 = args[3] ?? '';
          const id = `${sec.key}:${i++}`;
          const newVal = (values[id] ?? String(g3)).trim();
          return `${String(g1).trim()} ${String(g2).trim()} ${newVal}`;
        });
      });

      // Append any newly added lines.
      out = appendNewItems(out);

      await SaveFile(path, out);
      try { localStorage.removeItem(cacheKey(path)); } catch (e2) {}
      setAdded({});
      setInfo('Saved');
      if (typeof onSaved === 'function') onSaved();
    } catch (e) {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={className}>
      {sections.length === 0 ? (
        <div style={{ color: 'var(--muted, #8899aa)' }}>
            No recognized entries found in this file.<br/>
            Maybe try Advanced view ?
        </div>
      ) : (
        <>
          {sections.map(section => (
            <div key={section.key} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>{section.title}</div>
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    setAdded((prev) => {
                      const list = prev[section.key] ? [...prev[section.key]] : [];
                      list.push({ name: '', value: '' });
                      return { ...prev, [section.key]: list };
                    });
                  }}
                >
                  Add
                </button>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {section.items.map((m, idx) => {
                  const id = `${section.key}:${idx}`;
                  return (
                    <div key={id} style={{ display: 'grid', gridTemplateColumns: '160px 12px 1fr auto', gap: 8, alignItems: 'center' }}>
                      <label style={{ color: 'var(--muted, #99a)' }}>{(m[1] ?? '').trim()}</label>
                      <span>=</span>
                      <input
                        type="text"
                        value={values[id] ?? ''}
                        onChange={(e) => setValues(v => ({ ...v, [id]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          background: '#0b0d12',
                          border: '1px solid var(--border, #283140)',
                          borderRadius: 6,
                          color: 'inherit',
                          fontFamily: 'inherit',
                        }}
                        spellCheck={false}
                      />
                      <span />
                    </div>
                  );
                })}

                {(added[section.key] ?? []).map((it, nidx) => {
                  const rowKey = `${section.key}:new:${nidx}`;
                  return (
                    <div key={rowKey} style={{ display: 'grid', gridTemplateColumns: '160px 12px 1fr auto', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder={section.key === 'variables' || section.key === 'mainmod' ? '$name' : (section.key === 'env' ? 'env' : section.key)}
                        value={it.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setAdded(prev => {
                            const copy = { ...(prev[section.key] ?? []) } as any;
                            const list = [...(prev[section.key] ?? [])];
                            list[nidx] = { ...list[nidx], name };
                            return { ...prev, [section.key]: list };
                          });
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          background: '#0b0d12',
                          border: '1px solid var(--border, #283140)',
                          borderRadius: 6,
                          color: 'inherit',
                          fontFamily: 'inherit',
                        }}
                        spellCheck={false}
                      />
                      <span>=</span>
                      <input
                        type="text"
                        placeholder="value"
                        value={it.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAdded(prev => {
                            const list = [...(prev[section.key] ?? [])];
                            list[nidx] = { ...list[nidx], value };
                            return { ...prev, [section.key]: list };
                          });
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          background: '#0b0d12',
                          border: '1px solid var(--border, #283140)',
                          borderRadius: 6,
                          color: 'inherit',
                          fontFamily: 'inherit',
                        }}
                        spellCheck={false}
                      />
                      <button
                        className="btn btn--ghost"
                        onClick={() => {
                          setAdded(prev => {
                            const list = [...(prev[section.key] ?? [])];
                            list.splice(nidx, 1);
                            return { ...prev, [section.key]: list };
                          });
                        }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <button className="btn" disabled={saving || !path} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            {!path && <span style={{ color: 'var(--muted, #8899aa)', fontSize: 12 }}>No file selected</span>}
            {error && <span style={{ color: 'crimson', fontSize: 12 }}>{error}</span>}
            {info && !error && <span style={{ color: '#7aa2f7', fontSize: 12 }}>{info}</span>}
          </div>
        </>
      )}
    </div>
  );
}
