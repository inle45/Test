import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DB, DB_COUNTS } from './data/db.js';
import { randomSeedString } from './lib/rng.js';
import { downloadCanvas } from './lib/pixel.js';
import {
  resolveSpriteParams,
  renderSpriteSheet,
  SPRITE_SHEET_W,
  SPRITE_SHEET_H,
} from './render/sprite.js';
import {
  resolveFaceParams,
  renderFaceSheet,
  renderSingleFace,
  FACE_SHEET_W,
  FACE_SHEET_H,
} from './render/face.js';

const TABS = [
  { id: 'sprite', label: 'Character Sprite' },
  { id: 'face',   label: 'Face' },
];

function PreviewCanvas({ canvas, scale, label }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = '';
    if (!canvas) return;
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
    host.appendChild(canvas);
  }, [canvas, scale]);
  return (
    <div className="preview" aria-label={label}>
      <div ref={hostRef} />
    </div>
  );
}

function Selector({ label, options, value, onChange, formatLabel = (o) => o.name }) {
  return (
    <div className="control">
      <label>{label}</label>
      <select
        value={value === '__random__' ? '__random__' : value?.id ?? '__random__'}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '__random__') onChange(null);
          else onChange(options.find((o) => o.id === v) || null);
        }}
      >
        <option value="__random__">— Random —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{formatLabel(o)}</option>
        ))}
      </select>
    </div>
  );
}

function StringSelector({ label, options, value, onChange }) {
  return (
    <div className="control">
      <label>{label}</label>
      <select
        value={value ?? '__random__'}
        onChange={(e) => onChange(e.target.value === '__random__' ? null : e.target.value)}
      >
        <option value="__random__">— Random —</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function SpriteTab() {
  const [seed, setSeed] = useState(() => randomSeedString());
  const [skin, setSkin] = useState(null);
  const [hair, setHair] = useState(null);
  const [armor, setArmor] = useState(null);
  const [accessory, setAccessory] = useState(null);
  const [eye, setEye] = useState(null);
  const [scale, setScale] = useState(3);
  const [batch, setBatch] = useState([]);
  const [batchSize, setBatchSize] = useState(12);

  const params = useMemo(() => resolveSpriteParams(seed, {
    skin, hair, armor, accessory, eye,
  }), [seed, skin, hair, armor, accessory, eye]);

  const canvas = useMemo(() => renderSpriteSheet(params), [params]);

  const reroll = () => setSeed(randomSeedString());
  const exportSheet = () => {
    const safe = (params.seed || 'sprite').replace(/[^a-z0-9]/gi, '_').slice(0, 24);
    downloadCanvas(canvas, `mv_sprite_${safe}.png`);
  };

  const generateBatch = () => {
    const items = [];
    for (let i = 0; i < batchSize; i++) {
      const s = randomSeedString();
      const p = resolveSpriteParams(s);
      items.push({ seed: s, canvas: renderSpriteSheet(p), params: p });
    }
    setBatch(items);
  };

  const exportBatch = () => {
    batch.forEach((b, i) => {
      setTimeout(() => {
        downloadCanvas(b.canvas, `mv_sprite_${b.seed}.png`);
      }, i * 120);
    });
  };

  return (
    <>
      <section className="panel preview-panel">
        <h2>Preview · {SPRITE_SHEET_W}×{SPRITE_SHEET_H} · MV character sheet</h2>
        <PreviewCanvas canvas={canvas} scale={scale} label="Character sprite preview" />
        <div className="preview-meta">
          <span className="chip">seed: {params.seed}</span>
          <span className="chip dim">skin: {params.skin.name}</span>
          <span className="chip dim">hair: {params.hair.name}</span>
          <span className="chip dim">armor: {params.armor.name}</span>
          <span className="chip dim">acc: {params.accessory.name}</span>
          <span className="chip dim">eye: {params.eye.name}</span>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn ghost" onClick={() => setScale(Math.max(1, scale - 1))}>− zoom</button>
          <span className="chip">×{scale}</span>
          <button className="btn ghost" onClick={() => setScale(Math.min(8, scale + 1))}>+ zoom</button>
        </div>
      </section>

      <section className="panel">
        <h2>Parameters</h2>
        <div className="controls">
          <div className="control" style={{ gridColumn: '1 / span 2' }}>
            <label>Seed</label>
            <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} />
          </div>
          <Selector label={`Skin (${DB_COUNTS.skins})`} options={DB.skins} value={skin} onChange={setSkin} />
          <Selector label={`Hair (${DB_COUNTS.hairs})`} options={DB.hairs} value={hair} onChange={setHair} />
          <Selector label={`Armor (${DB_COUNTS.armors})`} options={DB.armors} value={armor} onChange={setArmor} />
          <Selector label={`Accessory (${DB_COUNTS.accessories})`} options={DB.accessories} value={accessory} onChange={setAccessory} />
          <Selector label={`Eyes (${DB_COUNTS.eyes})`} options={DB.eyes} value={eye} onChange={setEye} />
        </div>
      </section>

      <section className="panel">
        <h2>Batch generator</h2>
        <div className="controls">
          <div className="control">
            <label>Count</label>
            <input
              type="number"
              min="1"
              max="100"
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, Math.min(100, +e.target.value || 1)))}
            />
          </div>
          <div className="control" style={{ justifyContent: 'flex-end' }}>
            <label>&nbsp;</label>
            <button className="btn" onClick={generateBatch}>Generate {batchSize}</button>
          </div>
        </div>
        {batch.length > 0 && (
          <>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn primary" onClick={exportBatch}>Download all {batch.length}</button>
              <button className="btn ghost" onClick={() => setBatch([])}>Clear</button>
            </div>
            <div className="batch-grid">
              {batch.map((b) => (
                <div key={b.seed} className="batch-cell">
                  <BatchCanvas canvas={b.canvas} />
                  <div className="seed">{b.seed}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="footer-bar">
        <button className="btn" onClick={reroll}>🎲 Reroll seed</button>
        <button className="btn primary" onClick={exportSheet}>⬇ Export PNG</button>
      </div>
    </>
  );
}

function FaceTab() {
  const [seed, setSeed] = useState(() => randomSeedString());
  const [skin, setSkin] = useState(null);
  const [hair, setHair] = useState(null);
  const [armor, setArmor] = useState(null);
  const [accessory, setAccessory] = useState(null);
  const [eye, setEye] = useState(null);
  const [shape, setShape] = useState(null);
  const [expression, setExpression] = useState(null);
  const [scale, setScale] = useState(2);
  const [batch, setBatch] = useState([]);
  const [batchSize, setBatchSize] = useState(8);

  const params = useMemo(
    () => resolveFaceParams(seed, { skin, hair, armor, accessory, eye, shape, expression }),
    [seed, skin, hair, armor, accessory, eye, shape, expression]
  );

  // Build sheet by rolling 8 face variations from the chosen seed,
  // varying only expression so all 8 portraits stay visually consistent.
  const sheetParams = useMemo(() => {
    const out = [];
    for (let i = 0; i < 8; i++) {
      out.push({ ...params, expression: DB.expressions[i % DB.expressions.length] });
    }
    return out;
  }, [params]);

  const canvas = useMemo(() => renderFaceSheet(sheetParams), [sheetParams]);
  const singleCanvas = useMemo(() => renderSingleFace(params), [params]);

  const reroll = () => setSeed(randomSeedString());
  const exportSheet = () => {
    const safe = (params.seed || 'face').replace(/[^a-z0-9]/gi, '_').slice(0, 24);
    downloadCanvas(canvas, `mv_face_${safe}.png`);
  };

  const generateBatch = () => {
    const items = [];
    for (let i = 0; i < batchSize; i++) {
      const s = randomSeedString();
      const p = resolveFaceParams(s);
      const list = [];
      for (let j = 0; j < 8; j++) list.push({ ...p, expression: DB.expressions[j % DB.expressions.length] });
      items.push({ seed: s, canvas: renderFaceSheet(list), params: p });
    }
    setBatch(items);
  };

  const exportBatch = () => {
    batch.forEach((b, i) => {
      setTimeout(() => downloadCanvas(b.canvas, `mv_face_${b.seed}.png`), i * 120);
    });
  };

  return (
    <>
      <section className="panel preview-panel">
        <h2>Preview · {FACE_SHEET_W}×{FACE_SHEET_H} · MV face sheet (8 expressions)</h2>
        <PreviewCanvas canvas={canvas} scale={scale} label="Face sheet preview" />
        <div className="preview-meta">
          <span className="chip">seed: {params.seed}</span>
          <span className="chip dim">shape: {params.shape}</span>
          <span className="chip dim">skin: {params.skin.name}</span>
          <span className="chip dim">hair: {params.hair.name}</span>
          <span className="chip dim">armor: {params.armor.name}</span>
          <span className="chip dim">acc: {params.accessory.name}</span>
          <span className="chip dim">eye: {params.eye.name}</span>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn ghost" onClick={() => setScale(Math.max(1, scale - 1))}>− zoom</button>
          <span className="chip">×{scale}</span>
          <button className="btn ghost" onClick={() => setScale(Math.min(4, scale + 1))}>+ zoom</button>
        </div>
      </section>

      <section className="panel">
        <h2>Parameters</h2>
        <div className="controls">
          <div className="control" style={{ gridColumn: '1 / span 2' }}>
            <label>Seed</label>
            <input type="text" value={seed} onChange={(e) => setSeed(e.target.value)} />
          </div>
          <StringSelector label="Face shape" options={DB.faceShapes} value={shape} onChange={setShape} />
          <StringSelector label="Expression (single preview)" options={DB.expressions} value={expression} onChange={setExpression} />
          <Selector label={`Skin (${DB_COUNTS.skins})`} options={DB.skins} value={skin} onChange={setSkin} />
          <Selector label={`Hair (${DB_COUNTS.hairs})`} options={DB.hairs} value={hair} onChange={setHair} />
          <Selector label={`Armor / Outfit (${DB_COUNTS.armors})`} options={DB.armors} value={armor} onChange={setArmor} />
          <Selector label={`Accessory (${DB_COUNTS.accessories})`} options={DB.accessories} value={accessory} onChange={setAccessory} />
          <Selector label={`Eyes (${DB_COUNTS.eyes})`} options={DB.eyes} value={eye} onChange={setEye} />
        </div>
        <div style={{ marginTop: 10 }}>
          <h2>Single portrait preview</h2>
          <PreviewCanvas canvas={singleCanvas} scale={2} label="Single portrait" />
        </div>
      </section>

      <section className="panel">
        <h2>Batch generator</h2>
        <div className="controls">
          <div className="control">
            <label>Count (each = 1 sheet of 8)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, Math.min(50, +e.target.value || 1)))}
            />
          </div>
          <div className="control" style={{ justifyContent: 'flex-end' }}>
            <label>&nbsp;</label>
            <button className="btn" onClick={generateBatch}>Generate {batchSize}</button>
          </div>
        </div>
        {batch.length > 0 && (
          <>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn primary" onClick={exportBatch}>Download all {batch.length}</button>
              <button className="btn ghost" onClick={() => setBatch([])}>Clear</button>
            </div>
            <div className="batch-grid">
              {batch.map((b) => (
                <div key={b.seed} className="batch-cell">
                  <BatchCanvas canvas={b.canvas} />
                  <div className="seed">{b.seed}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="footer-bar">
        <button className="btn" onClick={reroll}>🎲 Reroll seed</button>
        <button className="btn primary" onClick={exportSheet}>⬇ Export PNG</button>
      </div>
    </>
  );
}

function BatchCanvas({ canvas }) {
  const ref = useRef(null);
  useEffect(() => {
    const host = ref.current;
    if (!host || !canvas) return;
    host.innerHTML = '';
    host.appendChild(canvas);
  }, [canvas]);
  return <div ref={ref} />;
}

export default function App() {
  const [tab, setTab] = useState('sprite');
  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brand">RPGMV<span className="dot">·</span>Asset Forge</div>
          <div className="subtitle">procedural · seedable · offline · MV-ready</div>
        </div>
        <div className="network-hint">
          LAN · <code>:5173</code>
        </div>
      </header>
      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main>
        {tab === 'sprite' && <SpriteTab />}
        {tab === 'face' && <FaceTab />}
      </main>
    </div>
  );
}
