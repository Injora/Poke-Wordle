import './PokemonGame.css';
import { useState, useEffect, useCallback } from 'react';

const maxGuess = 3;
const maxId = 898;


function getNum() { return Math.floor(Math.random() * maxId) + 1; }
function fixName(str) { return str.toLowerCase().trim(); }

function getGen(id) {
  if (id <= 151) return { label: 'Generation I', region: 'Kanto' };
  if (id <= 251) return { label: 'Generation II', region: 'Johto' };
  if (id <= 386) return { label: 'Generation III', region: 'Hoenn' };
  if (id <= 493) return { label: 'Generation IV', region: 'Sinnoh' };
  if (id <= 649) return { label: 'Generation V', region: 'Unova' };
  if (id <= 721) return { label: 'Generation VI', region: 'Kalos' };
  if (id <= 809) return { label: 'Generation VII', region: 'Alola' };
  return { label: 'Generation VIII', region: 'Galar' };
}

function checkGuess(myGuess, ans) {
  const g = fixName(myGuess).split('');
  const a = fixName(ans).split('');
  const res = g.map(() => 'absent');
  const usedA = a.map(() => false);
  const usedG = g.map(() => false);
  for (let i = 0; i < g.length; i++) {
    if (i < a.length && g[i] === a[i]) {
      res[i] = 'correct'; usedA[i] = true; usedG[i] = true;
    }
  }
  for (let i = 0; i < g.length; i++) {
    if (usedG[i]) continue;
    for (let j = 0; j < a.length; j++) {
      if (!usedA[j] && g[i] === a[j]) { res[i] = 'present'; usedA[j] = true; break; }
    }
  }
  return res;
}



function PicBox({ imgUrl, done }) {
  return (
    <div className="picBox">
      <img
        src={imgUrl}
        alt="Pokemon Silhouette"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: done ? 'none' : 'brightness(0)',
          transition: 'filter 0.5s ease',
          pointerEvents: 'none'
        }}
      />
      {!done && <div className="qMark">?</div>}
    </div>
  );
}

function AnsBoxes({ ans, shownNums, finished }) {
  return (
    <div className="ansBoxes">
      {ans.split('').map((letter, i) => {
        const isSpace = letter === ' ', isDash = letter === '-';
        const show = isSpace || isDash || shownNums.has(i) || finished;
        return (
          <div key={i} className={`oneBox ${isSpace ? "spaceBox" : ""} ${(shownNums.has(i) || finished) && !isSpace && !isDash ? "litBox" : ""}`.trim()}>
            <span className="boxLetter" style={{ opacity: show ? 1 : 0 }}>{show ? letter.toUpperCase() : '?'}</span>
          </div>
        );
      })}
    </div>
  );
}

function MyRow({ myGuess, res, len }) {
  const chars = myGuess.split('');
  return (
    <div className="guessRow">
      {Array.from({ length: Math.max(chars.length, len) }, (_, i) => {
        const ch = chars[i] || '';
        const status = res ? res[i] || 'absent' : 'empty';
        return (
          <div key={i} className="guess-cell-flip guessBox" style={{ backgroundColor: status === 'correct' ? 'var(--green)' : status === 'present' ? 'var(--yellow)' : status === 'absent' ? 'var(--gray)' : 'transparent',
            border: status === 'empty' ? '2px solid var(--border)' : '2px solid transparent',
            animationDelay: `${i * 60}ms`, }}>{ch.toUpperCase()}</div>
        );
      })}
    </div>
  );
}

function MyKeys({ clrs, clickKey }) {
  const rows = ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), ['Enter', ...'zxcvbnm'.split(''), '-', '⌫']];
  return (
    <div className="keyArea">
      {rows.map((row, ri) => (
        <div key={ri} className="keyRow">
          {row.map(k => {
            const s = clrs[k] || 'unused';
            return (
              <button key={k} onClick={() => clickKey(k)} className={`oneKey ${k === 'Enter' || k === '⌫' ? "bigKey" : ""}`.trim()} style={{ backgroundColor: s === 'correct' ? 'var(--green)' : s === 'present' ? 'var(--yellow)' : s === 'absent' ? '#2a2a3a' : 'var(--bg-card)',
                color: s === 'absent' ? 'var(--text-muted)' : 'var(--text-primary)', }}>
                {k === 'Enter' ? '↵' : k.toUpperCase()}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function HintBox({ ico, txt, val, clr }) {
  return (
    <div className="hintCard" style={{ borderColor: clr + '55', background: clr + '18' }}>
      <span style={{ fontSize: '1.2rem' }}>{ico}</span>
      <div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{txt}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: clr }}>{val}</div>
      </div>
    </div>
  );
}

export function PokemonGame() {
  const [pkmnInfo, setPkmnInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errMsg, setErrMsg] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [guessList, setGuessList] = useState([]);
  const [shownNums, setShownNums] = useState(new Set());
  const [status, setStatus] = useState('playing');
  const [hintNum, setHintNum] = useState(0);
  const [msg, setMsg] = useState('');
  const [doShake, setDoShake] = useState(false);
  const [streak, setStreak] = useState(0);

  const loadPkmn = useCallback(async function fetchPkmn() {
    setIsLoading(true);
    setErrMsg(null);
    setPkmnInfo(null);
    try {
      const myId = getNum();
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${myId}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      const newPkmn = {
        name: data.name,
        sprite: data.sprites.front_default,
        id: data.id,
        types: data.types.map(t => t.type.name),
      };
      setPkmnInfo(newPkmn);
      setUserInput('');
      setGuessList([]);
      setShownNums(new Set());
      setStatus('playing');
      setHintNum(0);
      setMsg('');
    } catch {
      setErrMsg('Failed to load. Retrying...');
      setTimeout(fetchPkmn, 1500);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPkmn(); }, [loadPkmn]);

  const keyColors = getKeyColors(guessList);

  const showOneLetter = useCallback((ans, curShown) => {
    const pool = [];
    for (let i = 0; i < ans.length; i++) {
      if (ans[i] !== ' ' && ans[i] !== '-' && !curShown.has(i)) pool.push(i);
    }
    if (!pool.length) return curShown;
    return new Set([...curShown, pool[Math.floor(Math.random() * pool.length)]]);
  }, []);

  const doSubmit = useCallback(() => {
    if (!pkmnInfo || status !== 'playing') return;
    const inp = fixName(userInput);
    const ans = fixName(pkmnInfo.name);
    if (!inp.length) { setDoShake(true); setTimeout(() => setDoShake(false), 500); return; }

    const res = checkGuess(inp, ans);
    const newList = [...guessList, { guess: inp, res }];
    setGuessList(newList);
    setUserInput('');
    setShownNums(prev => showOneLetter(ans, prev));

    if (inp === ans) {
      setStatus('won');
      setMsg(`🎉 Correct! Got it in ${newList.length} guess${newList.length > 1 ? 'es' : ''}!`);
      setStreak(s => s + 1);
      return;
    }

    const wrongNum = newList.length;
    if (wrongNum === 1) { setHintNum(1); setMsg('Hint unlocked: Type revealed!'); }
    else if (wrongNum === 2) { setHintNum(2); setMsg('Hint unlocked: Generation revealed!'); }
    else {
      setStatus('lost');
      setMsg(`Game over! It was ${pkmnInfo.name.toUpperCase()}!`);
      setStreak(0);
    }
  }, [pkmnInfo, userInput, guessList, status, showOneLetter]);

  const pressKey = useCallback((k) => {
    if (status !== 'playing') return;
    if (k === 'Enter') doSubmit();
    else if (k === '⌫') setUserInput(p => p.slice(0, -1));
    else if (k === '-') setUserInput(p => p + '-');
    else if (/^[a-z]$/i.test(k)) setUserInput(p => p + k.toLowerCase());
  }, [status, doSubmit]);

  useEffect(() => {
    const h = (e) => {
      if (status !== 'playing') return;
      if (e.key === 'Enter') { e.preventDefault(); doSubmit(); }
      else if (e.key === 'Backspace') setUserInput(p => p.slice(0, -1));
      else if (e.key === '-') setUserInput(p => p + '-');
      else if (e.key.length === 1 && /[a-z]/i.test(e.key)) setUserInput(p => p + e.key.toLowerCase());
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [status, doSubmit]);

  if (isLoading && !pkmnInfo) return (
    <div className="wrap">
      <div className="loadWrap">
        <div className="spinBall" />
        <p className="loadTxt">Catching a wild Pokémon...</p>
      </div>
    </div>
  );
  if (errMsg && !pkmnInfo) return <div className="wrap"><p style={{ color: 'var(--accent-red)' }}>{errMsg}</p></div>;
  if (!pkmnInfo) return null;

  const ans = fixName(pkmnInfo.name);
  const won = status === 'won';
  const lost = status === 'lost';
  const done = won || lost;
  const genInfo = getGen(pkmnInfo.id);

  return (
    <div className="wrap">
      <header className="topBar">
        <div className="streakBadge">Streak: {streak}</div>
        <div className="titleRow">
          <img src="/pokeball.svg" className="ball" alt="Pokeball" />
          <h1 className="title">
            Who&apos;s That <img src="/pokemon-23.svg" alt="Pokémon" style={{ height: '1.2em', verticalAlign: 'middle', marginTop: '-0.1em' }} />?
          </h1>
        </div>
        <p className="subTxt">3 guesses · Hints unlock on wrong answers</p>
      </header>

      <div className={doShake ? "shaky" : undefined}>
        {pkmnInfo.sprite && <PicBox imgUrl={pkmnInfo.sprite} done={done} />}
      </div>

      <div className="hintArea">
        {hintNum >= 1 && !done && (
          <HintBox ico="⚡" txt="Type"
            val={pkmnInfo.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' / ')}
            clr={typeClr[pkmnInfo.types[0]] || '#888'} />
        )}
        {hintNum >= 2 && !done && (
          <HintBox ico="🗺️" txt="Generation" val={`${genInfo.label} · ${genInfo.region}`} clr="#a78bfa" />
        )}
        {done && (
          <div className="endCard">
            <img src={pkmnInfo.sprite} alt={pkmnInfo.name} className="endImg" />
            <div>
              <div className="endName">{pkmnInfo.name.toUpperCase()}</div>
              <div className="endTypes">
                {pkmnInfo.types.map(t => (
                  <span key={t} className="typePill" style={{ background: typeClr[t] || '#555' }}>{t}</span>
                ))}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>
                #{String(pkmnInfo.id).padStart(3, '0')} · {genInfo.label} · {genInfo.region}
              </div>
            </div>
          </div>
        )}
      </div>

      {!done && (
        <div className="dots">
          {Array.from({ length: maxGuess }, (_, i) => (
            <div key={i} className="dot" style={{ background: i < guessList.length ? 'var(--gray)' : 'var(--border)' }} />
          ))}
        </div>
      )}

      <AnsBoxes ans={ans} shownNums={shownNums} finished={done} />

      {msg && (
        <div className="msgTxt" style={{ color: won ? 'var(--accent-green)' : lost ? 'var(--accent-red)' : 'var(--accent-yellow)' }}>
          {msg}
        </div>
      )}

      <div className="guessList">
        {guessList.map((g, i) => (
          <MyRow key={i} myGuess={g.guess} res={g.res} len={ans.length} />
        ))}
        {status === 'playing' && guessList.length < maxGuess && (
          <div className="guessRow">
            {(userInput || ' ').split('').map((l, i) => (
              <div key={i} className="guessBox" style={{ border: '2px solid var(--accent-blue)', backgroundColor: 'transparent' }}>{l.toUpperCase()}</div>
            ))}
            <div className="cursor" />
          </div>
        )}
      </div>

      {status === 'playing' && <MyKeys clrs={keyColors} clickKey={pressKey} />}

      {done && (
        <button onClick={loadPkmn} className="playBtn">▶ Play Again</button>
      )}

      {streak >= 5 && (
        <a href="https://www.instagram.com/injoraa/" target="_blank" rel="noopener noreferrer" className="igBtn" title="Instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px' }}>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>
      )}

      <footer className="foot">Powered by PokéAPI · Gen I–VIII</footer>
    </div>
  );
}

function getKeyColors(guessList) {
  const s = {};
  for (const { guess, res } of guessList) {
    guess.split('').forEach((l, i) => {
      const v = res[i] || 'absent';
      if (s[l] === 'correct') return;
      if (s[l] === 'present' && v !== 'correct') return;
      s[l] = v;
    });
  }
  return s;
}

const typeClr = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC',
};

