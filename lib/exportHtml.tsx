import { PHONEMES, PhonemeWord, KEYBOARD_ROWS } from "./phonemes";
import { buildWordSearch } from "./wordsearch";

function sharedStyle(darkMode: boolean): string {
  const vars = darkMode
    ? "--ink:#eef2f2;--bg:#0f1720;--surface:#16202b;--teal:#3fa79e;--teal-strong:#6cc6bd;--teal-soft:#17332f;--coral:#f0906a;--line:#263241;"
    : "--ink:#16213e;--bg:#f3f6f6;--surface:#ffffff;--teal:#0f6b66;--teal-strong:#0a4d49;--teal-soft:#dcf1ef;--coral:#e8734a;--line:#d8e2e1;";
  return `
  :root{${vars}}
  *{box-sizing:border-box;}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--ink);}
  header{padding:20px 24px;border-bottom:2px solid var(--line);background:var(--surface);}
  header h1{margin:0;font-family:Georgia,serif;font-size:1.4rem;}
  header p{margin:4px 0 0;font-size:.85rem;opacity:.75;}
  main{max-width:760px;margin:0 auto;padding:28px 20px 60px;}
  footer{text-align:center;font-size:.78rem;opacity:.6;padding:20px;}
  button{font:inherit;cursor:pointer;}
`;
}

function phonemeKeyRow(ipaTokens: string[], shortcutByIpa: Record<string, string>, rowIndex: number): string {
  const buttons = ipaTokens
    .map((ipa, colIndex) => {
      const p = PHONEMES.find((x) => x.ipa === ipa) || { label: ipa, example: "" };
      const shortcut = shortcutByIpa[ipa];
      const title = `/${ipa}/ as in ${p.example}${shortcut ? ` (${shortcut})` : ""}`;
      return `<button class="key" data-key="${ipa}" data-row="${rowIndex}" data-col="${colIndex}" title="${title}">${p.label}</button>`;
    })
    .join("");
  return `<div class="key-row">${buttons}</div>`;
}

export interface WordleExportConfig {
  words: PhonemeWord[];
  difficulty: "easy" | "normal" | "hard";
  darkMode?: boolean;
}

export function buildWordleHtml({ words, difficulty, darkMode = false }: WordleExportConfig): string {
  const sessionLength = difficulty === "hard" ? 4 : 6;
  const revealFirst = difficulty === "easy";

  const physicalKeyMap: Record<string, string> = {
    p: "p", t: "t", k: "k", b: "b", d: "d", g: "g", n: "n", m: "m",
    f: "f", s: "s", v: "v", z: "z", l: "l", r: "ɹ", w: "w", j: "j", h: "h",
  };
  const physicalShiftKeyMap: Record<string, string> = {
    n: "ŋ", t: "θ", d: "ð", s: "ʃ", z: "ʒ", c: "tʃ", j: "dʒ",
  };
  const shortcutByIpa: Record<string, string> = {};
  for (const [key, ipa] of Object.entries(physicalKeyMap)) shortcutByIpa[ipa] = key.toUpperCase();
  for (const [key, ipa] of Object.entries(physicalShiftKeyMap)) shortcutByIpa[ipa] = `Shift+${key.toUpperCase()}`;

  const data = { words, sessionLength, revealFirst };

  const answerKeyRows = words
    .map((w) => {
      const tags = w.phonemes
        .map((ipa) => {
          const p = PHONEMES.find((x) => x.ipa === ipa) || { label: ipa };
          return p.label;
        })
        .join(" · ");
      return `<tr><td>${w.english.toUpperCase()}</td><td class="mono">${tags}</td><td>${w.hint ?? ""}</td></tr>`;
    })
    .join("");

  const script = `
    const DATA = ${JSON.stringify(data)};
    const PHONEME_INFO = ${JSON.stringify(
      PHONEMES.reduce<Record<string, { label: string; example: string }>>((acc, p) => {
        acc[p.ipa] = { label: p.label, example: p.example };
        return acc;
      }, {})
    )};

    function seededOrder(poolSize, length, seed){
      const base = Array.from({length: poolSize}, (_, i) => i);
      let s = seed || 1;
      const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      for(let i = base.length - 1; i > 0; i--){
        const j = Math.floor(rand() * (i+1));
        [base[i], base[j]] = [base[j], base[i]];
      }
      const order = [];
      while(order.length < length) order.push(...base);
      return order.slice(0, length);
    }

    let seed = Date.now() % 100000;
    let session = seededOrder(DATA.words.length, DATA.sessionLength, seed).map(i => DATA.words[i]);
    let guesses = new Array(DATA.sessionLength).fill(null);
    let current = [];

    const board = document.getElementById('board');
    const clueEl = document.getElementById('clue');
    const banner = document.getElementById('banner');
    let bannerTimer = null;

    function activeRow(){ return guesses.findIndex(g => g === null); }
    function activeTarget(){ const r = activeRow(); return r === -1 ? null : session[r]; }

    function showBanner(text, type, ms){
      banner.textContent = text;
      banner.className = 'feedback-banner ' + type;
      banner.hidden = false;
      if(bannerTimer) clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => { banner.hidden = true; }, ms || (type === 'tip' ? 2200 : 5000));
    }

    function renderClue(){
      const t = activeTarget();
      if(t && t.hint){ clueEl.hidden = false; clueEl.textContent = '💡 Clue: ' + t.hint; }
      else if(!t){ clueEl.hidden = false; const correct = guesses.filter((g,i)=> g && g.every((v,j)=>v===session[i].phonemes[j])).length;
        clueEl.textContent = '✅ Session complete — ' + correct + ' of ' + DATA.sessionLength + ' correct.'; }
      else { clueEl.hidden = true; }
    }

    function renderBoard(){
      board.innerHTML = '';
      session.forEach((word, r) => {
        const row = document.createElement('div');
        row.className = 'wrow';
        row.dataset.row = r;
        word.phonemes.forEach((_, c) => {
          const cell = document.createElement('div');
          cell.className = 'tile';
          let tok = '';
          let state = '';
          const g = guesses[r];
          if(g){
            tok = g[c];
            if(tok === word.phonemes[c]) state = 'correct';
            else if(word.phonemes.includes(tok)) state = 'present';
            else state = 'absent';
          } else if(r === activeRow() && current[c]){
            tok = current[c];
          } else if(r === activeRow() && DATA.revealFirst && c === 0){
            tok = word.phonemes[0];
            state = 'hint';
          }
          if(state) cell.setAttribute('data-state', state);
          const info = PHONEME_INFO[tok];
          cell.innerHTML = tok ? ((info ? info.label : tok) + (info ? '<span class="tip">/'+tok+'/ &middot; as in '+info.example+'</span>' : '')) : '';
          row.appendChild(cell);
        });
        board.appendChild(row);
        if(guesses[r]){
          const g = guesses[r];
          const won = g.every((v,i)=>v===word.phonemes[i]);
          const note = document.createElement('span');
          note.className = 'row-note';
          note.textContent = (won ? '✓ ' : '→ ') + word.english.toUpperCase();
          row.appendChild(note);
        }
      });
    }

    function pressKey(k){
      const t = activeTarget();
      if(!t) return;
      if(current.length < t.phonemes.length) current.push(k);
      renderBoard();
    }
    function backspace(){ current.pop(); renderBoard(); }
    function submit(){
      const r = activeRow();
      const t = activeTarget();
      if(!t) return;
      if(current.length !== t.phonemes.length){
        showBanner('Keep building the word — need ' + t.phonemes.length + ' phoneme tiles.', 'tip');
        return;
      }
      const won = current.every((v,i)=>v===t.phonemes[i]);
      guesses[r] = current;
      current = [];
      renderBoard();
      renderClue();
      if(won){
        showBanner('🎉 Correct! "' + t.english + '" — moving to the next word.', 'win', 1600);
      } else {
        const rowEl = board.querySelector('[data-row="'+r+'"]');
        if(rowEl){ rowEl.classList.add('shake'); setTimeout(()=>rowEl.classList.remove('shake'), 500); }
        showBanner('Not quite — that word was "' + t.english + '".', 'lose', 1600);
      }
      if(r === DATA.sessionLength - 1){
        setTimeout(() => {
          const correct = guesses.filter((g,i)=> g && g.every((v,j)=>v===session[i].phonemes[j])).length;
          showBanner('Session complete! ' + correct + ' of ' + DATA.sessionLength + ' correct.', 'win');
        }, 1700);
      }
    }
    function restart(){
      seed = Date.now() % 100000;
      session = seededOrder(DATA.words.length, DATA.sessionLength, seed).map(i => DATA.words[i]);
      guesses = new Array(DATA.sessionLength).fill(null);
      current = [];
      banner.hidden = true;
      renderClue();
      renderBoard();
    }

    document.querySelectorAll('.key').forEach(btn=>{
      btn.addEventListener('click', ()=>pressKey(btn.getAttribute('data-key')));
    });
    document.getElementById('backspace').addEventListener('click', backspace);
    document.getElementById('submit').addEventListener('click', submit);
    document.getElementById('restart').addEventListener('click', restart);

    // Physical keyboard support, mirroring the on-screen keyboard.
    var PHYSICAL_KEY_MAP = {p:'p',t:'t',k:'k',b:'b',d:'d',g:'g',n:'n',m:'m',f:'f',s:'s',v:'v',z:'z',l:'l',r:'ɹ',w:'w',j:'j',h:'h'};
    var PHYSICAL_SHIFT_KEY_MAP = {n:'ŋ',t:'θ',d:'ð',s:'ʃ',z:'ʒ',c:'tʃ',j:'dʒ'};
    document.addEventListener('keydown', function(e){
      var tag = (e.target && e.target.tagName) || '';
      if(tag === 'TEXTAREA' || tag === 'INPUT') return;
      if(tag === 'BUTTON'){
        if(e.key === 'Enter' || e.key === 'Backspace') return; // let the focused button's own activation run
      }
      if(e.key === 'Enter'){ e.preventDefault(); submit(); return; }
      if(e.key === 'Backspace'){ e.preventDefault(); backspace(); return; }
      var base = e.key.toLowerCase();
      var mapped = e.shiftKey ? PHYSICAL_SHIFT_KEY_MAP[base] : PHYSICAL_KEY_MAP[base];
      if(mapped){ e.preventDefault(); pressKey(mapped); }
    });

    // Arrow-key navigation across the on-screen keyboard, based on its
    // logical layout (row/col data attributes), not pixel position:
    // Up/Down move to the row above/below (clamped column); Right moves to
    // the next key in reading order, wrapping onto the next row (and back
    // to the first key at the very end); Left is the mirror of Right.
    var KEY_ROWS_EL = [...document.querySelectorAll('.key-row')].map(function(rowEl){
      return [...rowEl.querySelectorAll('.key')];
    });
    var FLAT_KEYS_EL = [].concat.apply([], KEY_ROWS_EL);
    document.querySelectorAll('.key').forEach(function(btn){
      btn.addEventListener('keydown', function(e){
        if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
        e.preventDefault();
        var row = parseInt(btn.getAttribute('data-row'), 10);
        var col = parseInt(btn.getAttribute('data-col'), 10);

        if(e.key === 'ArrowUp' || e.key === 'ArrowDown'){
          var targetRow = e.key === 'ArrowUp' ? Math.max(0, row - 1) : Math.min(KEY_ROWS_EL.length - 1, row + 1);
          var targetCol = Math.min(col, KEY_ROWS_EL[targetRow].length - 1);
          KEY_ROWS_EL[targetRow][targetCol].focus();
          return;
        }

        var flatIndex = FLAT_KEYS_EL.indexOf(btn);
        var nextIndex = e.key === 'ArrowRight'
          ? (flatIndex + 1) % FLAT_KEYS_EL.length
          : (flatIndex - 1 + FLAT_KEYS_EL.length) % FLAT_KEYS_EL.length;
        FLAT_KEYS_EL[nextIndex].focus();
      });
    });

    renderClue();
    renderBoard();
  `;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="${darkMode ? 'dark' : 'light'}" />
<title>Phoneme Wordle — Speech Pathology Activity</title>
<style>
${sharedStyle(darkMode)}
.wrow{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:8px;}
.tile{position:relative;width:56px;height:56px;border:2px solid var(--line);border-radius:8px;background:var(--surface);
  display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;font-family:ui-monospace,monospace;}
.tile[data-state="correct"]{background:var(--teal);border-color:var(--teal);color:#fff;}
.tile[data-state="present"]{background:var(--coral);border-color:var(--coral);color:#fff;}
.tile[data-state="absent"]{opacity:.5;}
.tile[data-state="hint"]{border-style:dashed;}
.tile .tip{position:absolute;bottom:105%;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;
  font-size:.65rem;padding:3px 6px;border-radius:4px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s;}
.tile:hover .tip{opacity:1;}
.row-note{font-size:.72rem;font-family:ui-monospace,monospace;opacity:.75;white-space:nowrap;}
.keyboard-wrap{margin-top:24px;overflow-x:auto;}
.keys{display:flex;flex-direction:column;gap:8px;width:fit-content;margin:0 auto;}
.key-row{display:flex;gap:8px;}
.key{width:44px;height:40px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:6px;border:2px solid var(--line);background:var(--surface);font-weight:600;cursor:pointer;transition:transform .15s;padding:0;}
@media (min-width:480px){ .key{width:56px;height:48px;} }
.key:hover{transform:translateY(-2px);box-shadow:0 4px 10px rgba(0,0,0,.12);}
.controls{display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap;}
.controls button{padding:10px 18px;border-radius:6px;border:none;background:var(--teal);color:#fff;font-weight:700;cursor:pointer;transition:transform .15s;}
.controls button:hover{transform:translateY(-2px);}
.controls button#backspace{background:var(--line);color:var(--ink);}
.controls button#restart{background:var(--surface);color:var(--ink);border:2px solid var(--line);}
#clue{text-align:center;font-weight:600;background:#fbe4d8;border-radius:8px;padding:8px 14px;margin:0 auto 18px;max-width:560px;}
.kb-hint{text-align:center;font-size:.78rem;opacity:.6;margin:0 auto 14px;max-width:640px;}
@keyframes shake-row{10%,90%{transform:translateX(-2px);}20%,80%{transform:translateX(4px);}30%,50%,70%{transform:translateX(-8px);}40%,60%{transform:translateX(8px);}}
.shake{animation:shake-row .5s;}
@keyframes banner-in{from{opacity:0;transform:translate(-50%,-14px);}to{opacity:1;transform:translate(-50%,0);}}
.feedback-banner{position:fixed;top:18px;left:50%;transform:translate(-50%,0);z-index:50;padding:14px 22px;border-radius:10px;font-weight:700;
  box-shadow:0 8px 24px rgba(0,0,0,.18);animation:banner-in .25s ease-out;}
.feedback-banner.win{background:var(--teal);color:#fff;}
.feedback-banner.lose{background:#dc2626;color:#fff;}
.feedback-banner.tip{background:var(--ink);color:#f3f6f6;}
details.answer-key{margin-top:36px;border:2px solid var(--line);border-radius:8px;padding:12px 16px;}
details.answer-key summary{cursor:pointer;font-weight:700;}
table.answer-table{width:100%;border-collapse:collapse;margin-top:10px;font-size:.85rem;}
table.answer-table th, table.answer-table td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);}
table.answer-table td.mono{font-family:ui-monospace,monospace;}
</style>
</head>
<body>
<div id="banner" class="feedback-banner" role="status" aria-live="assertive" hidden></div>
<header><h1>Phoneme Wordle</h1><p>Guess each phoneme-based word. Hover any tile or key for its sound.</p></header>
<main>
  <p id="clue" hidden></p>
  <p class="kb-hint">⌨️ Keyboard: type P T K B D G N M F S V Z L R W J H directly, Shift+N/T/D/S/Z/C/J
    for NG/TH/TH/SH/ZH/CH/J. Vowels have no letter shortcut — Tab + arrow keys + Enter/Space.
    Enter submits, Backspace deletes.</p>
  <div id="board" role="grid" aria-label="Wordle board"></div>
  <div class="keyboard-wrap">
    <div class="keys" aria-label="Phoneme keyboard">
      ${KEYBOARD_ROWS.map((row, i) => phonemeKeyRow(row, shortcutByIpa, i)).join("\n")}
    </div>
  </div>
  <div class="controls">
    <button id="backspace" type="button">⌫ Back</button>
    <button id="submit" type="button">Submit guess</button>
    <button id="restart" type="button">🔄 Restart session</button>
  </div>

  <details class="answer-key">
    <summary>Word list &amp; answer key (for the teacher)</summary>
    <table class="answer-table">
      <thead><tr><th>Word</th><th>Phonemes</th><th>Hint shown to students</th></tr></thead>
      <tbody>${answerKeyRows}</tbody>
    </table>
  </details>
</main>
<footer>Generated by the Phoneme Activity Builder for Speech Pathology classrooms.</footer>
<script>${script}</script>
</body>
</html>`;
}

export interface WordSearchExportConfig {
  words: PhonemeWord[];
  rows: number;
  cols: number;
  seed?: number;
  revealAnswers: boolean;
  darkMode?: boolean;
}

export function buildWordSearchHtml({
  words,
  rows,
  cols,
  seed = 42,
  revealAnswers,
  darkMode = false,
}: WordSearchExportConfig): string {
  const tokenLists = words.map((w) => w.phonemes);
  const { grid, placements } = buildWordSearch(tokenLists, rows, cols, seed);

  const phonemeList = words
    .map((w) => {
      const tags = w.phonemes
        .map((ipa) => {
          const p = PHONEMES.find((x) => x.ipa === ipa) || { label: ipa, example: "" };
          return `<span class="ptag" title="/${ipa}/ as in ${p.example}">${p.label}</span>`;
        })
        .join("");
      return `<li data-word="${w.phonemes.join(" ")}"><strong>${w.english.toUpperCase()}</strong> ${tags}</li>`;
    })
    .join("");

  const data = {
    grid,
    rows,
    cols,
    words: tokenLists,
    placements: placements.map((p) => ({ tokens: p.tokens, row: p.row, col: p.col, dir: p.dir })),
    revealAnswers,
  };

  const script = `
    const DATA = ${JSON.stringify(data)};
    const gridEl = document.getElementById('grid');
    gridEl.style.gridTemplateColumns = 'repeat(' + DATA.cols + ', 1fr)';
    gridEl.style.touchAction = 'none';
    let selecting = false;
    let start = null;
    let found = new Set();
    let answersShown = DATA.revealAnswers;

    // touchmove doesn't fire per-cell the way mouseenter does — the browser
    // keeps sending it to whatever element the finger first touched — so we
    // find the real cell under the finger via elementFromPoint instead.
    gridEl.addEventListener('touchmove', (e) => {
      if(!selecting) return;
      e.preventDefault();
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cellEl = el && el.closest('[data-r]');
      if(cellEl) previewTo(parseInt(cellEl.dataset.r, 10), parseInt(cellEl.dataset.c, 10));
    }, { passive: false });
    gridEl.addEventListener('touchend', () => { if(selecting){ selecting = false; checkSelection(); } });

    function render(){
      gridEl.innerHTML = '';
      DATA.grid.forEach((row, r) => {
        row.forEach((tok, c) => {
          const cell = document.createElement('button');
          cell.type = 'button';
          cell.className = 'cell';
          cell.textContent = tok;
          cell.dataset.r = r; cell.dataset.c = c;
          if(answersShown && DATA.placements.some(p => cellInPlacement(p, r, c))) cell.classList.add('answer');
          cell.addEventListener('mousedown', () => { selecting = true; start = {r,c}; clearSel(); mark(cell); });
          cell.addEventListener('mouseenter', () => { if(selecting) previewTo(r,c); });
          cell.addEventListener('mouseup', () => { selecting = false; checkSelection(); });
          cell.addEventListener('touchstart', (e) => { e.preventDefault(); selecting = true; start = {r,c}; clearSel(); mark(cell); }, { passive: false });
          cell.addEventListener('keydown', (e) => {
            if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)){
              e.preventDefault();
              const total = DATA.rows * DATA.cols;
              let rr = r, cc = c;
              if(e.key === 'ArrowRight'){ const idx = ((r*DATA.cols+c+1) % total + total) % total; rr = Math.floor(idx/DATA.cols); cc = idx % DATA.cols; }
              else if(e.key === 'ArrowLeft'){ const idx = ((r*DATA.cols+c-1) % total + total) % total; rr = Math.floor(idx/DATA.cols); cc = idx % DATA.cols; }
              else if(e.key === 'ArrowDown'){ rr = Math.min(DATA.rows-1, r+1); }
              else if(e.key === 'ArrowUp'){ rr = Math.max(0, r-1); }
              const target = cellEl(rr, cc);
              if(target) target.focus();
              return;
            }
            if(e.key === 'Enter' || e.key === ' '){
              e.preventDefault();
              if(!selecting){ selecting = true; start = {r,c}; clearSel(); mark(cell); }
              else { previewTo(r,c); selecting = false; checkSelection(); }
              return;
            }
            if(e.key === 'Escape'){ selecting = false; start = null; clearSel(); }
          });
          gridEl.appendChild(cell);
        });
      });
    }
    function cellInPlacement(p, r, c){
      for(let i=0;i<p.tokens.length;i++){
        if(p.row + p.dir.dr*i === r && p.col + p.dir.dc*i === c) return true;
      }
      return false;
    }
    function cellEl(r,c){ return gridEl.children[r*DATA.cols+c]; }
    function clearSel(){ [...gridEl.children].forEach(el=>el.classList.remove('sel')); }
    function mark(el){ el.classList.add('sel'); }
    function previewTo(r,c){
      clearSel();
      if(!start) return;
      const dr = Math.sign(r-start.r), dc = Math.sign(c-start.c);
      let rr=start.r, cc=start.c, steps=0;
      mark(cellEl(rr,cc));
      while((rr!==r || cc!==c) && steps < Math.max(DATA.rows,DATA.cols)){
        rr = Math.min(DATA.rows-1, Math.max(0, rr+(dr||0)));
        cc = Math.min(DATA.cols-1, Math.max(0, cc+(dc||0)));
        if(cellEl(rr,cc)) mark(cellEl(rr,cc));
        steps++;
        if(rr===r&&cc===c) break;
      }
    }
    function checkSelection(){
      const chosen = [...gridEl.children].filter(el=>el.classList.contains('sel'));
      const tokens = chosen.map(el=>el.textContent);
      const reversed = [...tokens].reverse();
      const match = DATA.words.find(w => JSON.stringify(w)===JSON.stringify(tokens) || JSON.stringify(w)===JSON.stringify(reversed));
      if(match && !found.has(match.join(' '))){
        found.add(match.join(' '));
        chosen.forEach(el=>{ el.classList.remove('sel'); el.classList.add('found'); });
        const li = document.querySelector('[data-word="'+match.join(' ')+'"]');
        const englishWord = li ? li.querySelector('strong').textContent : match.join('');
        if(li) li.classList.add('done');
        updateStatus();
        if(found.size === DATA.words.length){
          showBanner('🎉 Correct! All ' + DATA.words.length + ' words found — nice work!', 'win', 4000);
        } else {
          const remaining = DATA.words.length - found.size;
          showBanner('🎉 Correct! "' + englishWord + '" — ' + remaining + ' word' + (remaining===1?'':'s') + ' to go.', 'win', 2000);
        }
      } else {
        if(tokens.length > 1) showBanner('Not a match — try another direction.', 'lose', 1500);
        clearSel();
      }
    }
    function showBanner(text, type, ms){
      const banner = document.getElementById('banner');
      banner.textContent = text;
      banner.className = 'feedback-banner ' + type;
      banner.hidden = false;
      clearTimeout(showBanner._t);
      showBanner._t = setTimeout(() => { banner.hidden = true; }, ms || 2000);
    }
    function updateStatus(){
      const status = document.getElementById('status');
      status.textContent = found.size + ' of ' + DATA.words.length + ' words found.';
      if(found.size === DATA.words.length) status.textContent += ' All words found!';
    }
    document.getElementById('toggle-answers').addEventListener('click', () => {
      answersShown = !answersShown;
      render();
      document.getElementById('toggle-answers').textContent = answersShown ? 'Hide answers' : 'Show answers';
    });
    render();
    updateStatus();
  `;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="${darkMode ? 'dark' : 'light'}" />
<title>Phoneme Word Search — Speech Pathology Activity</title>
<style>
${sharedStyle(darkMode)}
#grid{display:grid;gap:6px;max-width:560px;margin:0 auto;}
.cell{aspect-ratio:1;border:1px solid var(--line);background:var(--surface);border-radius:4px;font-weight:700;
  font-family:ui-monospace,monospace;font-size:1.1rem;display:flex;align-items:center;justify-content:center;user-select:none;padding:0;
  cursor:pointer;transition:transform .1s ease,box-shadow .1s ease;position:relative;}
.cell:hover{transform:scale(1.1);box-shadow:0 4px 10px rgba(0,0,0,.12);z-index:1;}
.cell:focus-visible{outline:3px solid var(--teal);outline-offset:2px;z-index:2;}
.cell.sel{background:var(--coral);color:#fff;}
.cell.found{background:var(--teal);color:#fff;}
.cell.answer{border:2.5px dashed var(--teal-strong) !important;background:var(--teal-soft);}
.wordlist{list-style:none;margin:22px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:12px;justify-content:center;}
.wordlist li{background:var(--surface);border:2px solid var(--line);border-radius:8px;padding:8px 12px;font-size:.9rem;}
.wordlist li.done strong{text-decoration:line-through;color:var(--teal);}
.ptag{font-family:ui-monospace,monospace;font-size:.7rem;background:var(--line);border-radius:4px;padding:1px 5px;margin-left:4px;}
#status{text-align:center;margin-top:16px;font-weight:600;}
.toolbar{text-align:center;margin-top:14px;}
.toolbar button{padding:8px 16px;border-radius:6px;border:2px solid var(--line);background:var(--surface);font-weight:600;
  cursor:pointer;transition:transform .15s ease,box-shadow .15s ease;}
.toolbar button:hover{transform:translateY(-2px);box-shadow:0 4px 10px rgba(0,0,0,.12);}
@keyframes banner-in{from{opacity:0;transform:translate(-50%,-14px);}to{opacity:1;transform:translate(-50%,0);}}
.feedback-banner{position:fixed;top:18px;left:50%;transform:translate(-50%,0);z-index:50;padding:14px 22px;border-radius:10px;font-weight:700;
  box-shadow:0 8px 24px rgba(0,0,0,.18);animation:banner-in .25s ease-out;}
.feedback-banner.win{background:var(--teal);color:#fff;}
.feedback-banner.lose{background:#dc2626;color:#fff;}
.feedback-banner.tip{background:var(--ink);color:#f3f6f6;}
</style>
</head>
<body>
<div id="banner" class="feedback-banner" role="status" aria-live="assertive" hidden></div>
<header><h1>Phoneme Word Search</h1><p>Click and drag across letters to find each phoneme-based word.</p></header>
<main>
  <p class="kb-hint">⌨️ Keyboard support: Tab to a tile, arrow keys to move (Left/Right continue onto
    the next/previous row at the edge), Enter/Space to mark the start of a word and again to check
    it, Escape to cancel.</p>
  <div id="grid" role="grid" aria-label="Word search grid"></div>
  <div class="toolbar"><button id="toggle-answers" type="button">${revealAnswers ? "Hide answers" : "Show answers"}</button></div>
  <ul class="wordlist">${phonemeList}</ul>
  <p id="status" role="status" aria-live="polite"></p>
</main>
<footer>Generated by the Phoneme Activity Builder for Speech Pathology classrooms.</footer>
<script>${script}</script>
</body>
</html>`;
}
