'use client'
import { useState } from 'react'

const SYMBOLS = [
  { id: 'R_10', label: 'Volatility 10' },
  { id: 'R_25', label: 'Volatility 25' },
  { id: 'R_50', label: 'Volatility 50' },
  { id: 'R_75', label: 'Volatility 75' },
  { id: 'R_100', label: 'Volatility 100' },
  { id: '1HZ10V', label: 'Volatility 10 (1s)' },
  { id: '1HZ25V', label: 'Volatility 25 (1s)' },
  { id: '1HZ50V', label: 'Volatility 50 (1s)' },
  { id: '1HZ75V', label: 'Volatility 75 (1s)' },
  { id: '1HZ100V', label: 'Volatility 100 (1s)' },
]

const STRATEGIES = [
  { id: 'martingale', label: 'Martingale', desc: 'Double stake after loss' },
  { id: 'anti_martingale', label: 'Anti-Martingale', desc: 'Double stake after win' },
  { id: 'dalembert', label: "D'Alembert", desc: '+1 unit after loss, -1 after win' },
  { id: 'flat', label: 'Flat Betting', desc: 'Fixed stake every trade' },
  { id: 'fibonacci', label: 'Fibonacci', desc: 'Follow Fibonacci sequence' },
]

const CONTRACT_TYPES = [
  { id: 'CALL', label: 'Rise' },
  { id: 'PUT', label: 'Fall' },
  { id: 'DIGITEVEN', label: 'Even' },
  { id: 'DIGITODD', label: 'Odd' },
  { id: 'DIGITMATCH', label: 'Matches' },
  { id: 'DIGITDIFF', label: 'Differs' },
  { id: 'DIGITOVER', label: 'Over' },
  { id: 'DIGITUNDER', label: 'Under' },
  { id: 'ACCU', label: 'Accumulator' },
]

function generateXML(cfg: any): string {
  const { symbol, contract, strategy, initialStake, maxStake, maxLoss, takeProfit, duration, growthRate, digit } = cfg

  const getMartingale = () => `
      <block type="math_arithmetic">
        <field name="OP">MULTIPLY</field>
        <value name="A"><block type="trade_again_stake"/></value>
        <value name="B"><block type="math_number"><field name="NUM">2</field></block></value>
      </block>`

  const getDalembert = () => `
      <block type="math_arithmetic">
        <field name="OP">ADD</field>
        <value name="A"><block type="trade_again_stake"/></value>
        <value name="B"><block type="math_number"><field name="NUM">${initialStake}</field></block></value>
      </block>`

  const getFibonacci = () => `
      <block type="math_arithmetic">
        <field name="OP">MULTIPLY</field>
        <value name="A"><block type="trade_again_stake"/></value>
        <value name="B"><block type="math_number"><field name="NUM">1.618</field></block></value>
      </block>`

  const getStakeOnLoss = () => {
    switch (strategy) {
      case 'martingale': return getMartingale()
      case 'dalembert': return getDalembert()
      case 'fibonacci': return getFibonacci()
      case 'anti_martingale': return `<block type="math_number"><field name="NUM">${initialStake}</field></block>`
      default: return `<block type="math_number"><field name="NUM">${initialStake}</field></block>`
    }
  }

  const getStakeOnWin = () => {
    if (strategy === 'anti_martingale') return getMartingale()
    return `<block type="math_number"><field name="NUM">${initialStake}</field></block>`
  }

  const contractParams = () => {
    if (['DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER'].includes(contract)) {
      return `
        <field name="DURATION">1</field>
        <field name="DURATION_UNIT">t</field>
        ${['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER'].includes(contract) ? `<field name="BARRIER">${digit}</field>` : ''}`
    }
    if (contract === 'ACCU') {
      return `
        <field name="GROWTH_RATE">${growthRate / 100}</field>`
    }
    return `
        <field name="DURATION">${duration}</field>
        <field name="DURATION_UNIT">t</field>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="trade_definition" x="40" y="40">
    <statement name="TRADE_OPTIONS">
      <block type="trade_definition_market">
        <field name="MARKET_LIST">Volatility Indices</field>
        <field name="SUBMARKET_LIST">Random Index</field>
        <field name="SYMBOL_LIST">${symbol}</field>
        <next>
          <block type="trade_definition_tradetype">
            <field name="TRADETYPE_LIST">${contract}</field>
            <next>
              <block type="trade_definition_contracttype">
                <field name="TYPE_LIST">${contract}</field>
                <next>
                  <block type="trade_definition_duration">${contractParams()}
                    <next>
                      <block type="trade_definition_stake">
                        <field name="CURRENCY_LIST">USD</field>
                        <value name="STAKE">
                          <block type="math_number">
                            <field name="NUM">${initialStake}</field>
                          </block>
                        </value>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
    <statement name="PURCHASE_CONDITIONS">
      <block type="purchase_conditions">
        <statement name="PURCHASE_CONDITION_CHILD">
          <block type="contract_check">
            <field name="CONDITION">TICK_COUNT</field>
            <value name="VALUE">
              <block type="math_number">
                <field name="NUM">1</field>
              </block>
            </value>
          </block>
        </statement>
      </block>
    </statement>
    <statement name="SELL_CONDITIONS">
      <block type="sell_at_market"/>
    </statement>
    <statement name="INITIALIZATION">
      <block type="variables_set">
        <field name="VAR">current_stake</field>
        <value name="VALUE">
          <block type="math_number">
            <field name="NUM">${initialStake}</field>
          </block>
        </value>
        <next>
          <block type="variables_set">
            <field name="VAR">total_profit</field>
            <value name="VALUE">
              <block type="math_number"><field name="NUM">0</field></block>
            </value>
            <next>
              <block type="variables_set">
                <field name="VAR">trade_count</field>
                <value name="VALUE">
                  <block type="math_number"><field name="NUM">0</field></block>
                </value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
    <statement name="AFTER_PURCHASE">
      <block type="after_purchase_condition">
        <value name="CONDITION">
          <block type="logic_compare">
            <field name="OP">LT</field>
            <value name="A">
              <block type="variables_get"><field name="VAR">total_profit</field></block>
            </value>
            <value name="B">
              <block type="math_number"><field name="NUM">-${maxLoss}</field></block>
            </value>
          </block>
        </value>
        <statement name="ACTION">
          <block type="trade_results">
            <field name="RESULT">win</field>
            <next>
              <block type="notify">
                <field name="TYPE">error</field>
                <field name="MESSAGE">Max loss $${maxLoss} reached. Bot stopped.</field>
              </block>
            </next>
          </block>
        </statement>
      </block>
      <block type="trade_results">
        <field name="RESULT">win</field>
        <statement name="WIN">
          <block type="variables_set">
            <field name="VAR">current_stake</field>
            <value name="VALUE">${getStakeOnWin()}
            </value>
            <next>
              <block type="check_win_or_lose">
                <statement name="WIN_ACTION">
                  <block type="notify">
                    <field name="TYPE">success</field>
                    <field name="MESSAGE">WIN! Resetting stake to $${initialStake}</field>
                  </block>
                </statement>
              </block>
            </next>
          </block>
        </statement>
        <statement name="LOSS">
          <block type="variables_set">
            <field name="VAR">current_stake</field>
            <value name="VALUE">
              <block type="math_constrain">
                <value name="VALUE">${getStakeOnLoss()}
                </value>
                <value name="LOW">
                  <block type="math_number"><field name="NUM">${initialStake}</field></block>
                </value>
                <value name="HIGH">
                  <block type="math_number"><field name="NUM">${maxStake}</field></block>
                </value>
              </block>
            </value>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`
}

export default function BotBuilderPage() {
  const [tab, setTab] = useState<'builder'|'dbot'>('builder')
  const [symbol, setSymbol] = useState('R_50')
  const [contract, setContract] = useState('CALL')
  const [strategy, setStrategy] = useState('martingale')
  const [initialStake, setInitialStake] = useState('1')
  const [maxStake, setMaxStake] = useState('100')
  const [maxLoss, setMaxLoss] = useState('50')
  const [takeProfit, setTakeProfit] = useState('100')
  const [duration, setDuration] = useState('1')
  const [growthRate, setGrowthRate] = useState('1')
  const [digit, setDigit] = useState('5')
  const [xml, setXml] = useState('')
  const [copied, setCopied] = useState(false)
  const [dbotSrc, setDbotSrc] = useState<string | null>(null)

  const generate = () => {
    const cfg = { symbol, contract, strategy, initialStake, maxStake, maxLoss, takeProfit, duration, growthRate, digit }
    setXml(generateXML(cfg))
  }

  const copyXml = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(xml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadXml = () => {
    if (typeof window !== 'undefined') {
      const blob = new Blob([xml], { type: 'text/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nft-bot-${symbol}-${strategy}.xml`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const openInDBot = () => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('deriv_auth')
      if (auth) {
        const { token, account } = JSON.parse(auth)
        setDbotSrc(`https://dbot.deriv.com?acct1=${account}&token1=${token}&cur1=USD`)
      } else {
        setDbotSrc('https://dbot.deriv.com')
      }
      setTab('dbot')
    }
  }

  const s = (val: string, cur: string) => ({
    padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
    background: val === cur ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.03)',
    border: val === cur ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.07)',
    color: val === cur ? '#00e676' : '#8892a4',
    cursor: 'pointer', fontFamily: 'Inter,sans-serif',
  } as React.CSSProperties)

  const inp = { width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e8eaf0', fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none' } as React.CSSProperties

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', background: '#06080f' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 20px', flexShrink: 0 }}>
        {[{ id: 'builder', label: '🔧 Bot Builder', desc: 'Generate XML' }, { id: 'dbot', label: '🤖 Deriv Bot', desc: 'Visual editor' }].map(t => (
          <button key={t.id} onClick={() => { if (t.id === 'dbot') openInDBot(); else setTab('builder') }} style={{
            padding: '14px 20px', background: 'transparent', border: 'none',
            borderBottom: tab === t.id ? '2px solid #00e676' : '2px solid transparent',
            color: tab === t.id ? '#e8eaf0' : '#4a5568', cursor: 'pointer',
            fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'dbot' && dbotSrc ? (
        <iframe src={dbotSrc} style={{ flex: 1, border: 'none', width: '100%' }} allow="clipboard-read; clipboard-write" title="Deriv Bot" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Config */}
          <div style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0' }}>⚙️ Bot Configuration</div>

            <div>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Symbol</div>
              <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ ...inp }}>
                {SYMBOLS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Contract Type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {CONTRACT_TYPES.map(c => <button key={c.id} onClick={() => setContract(c.id)} style={s(c.id, contract)}>{c.label}</button>)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Strategy</div>
              {STRATEGIES.map(st => (
                <button key={st.id} onClick={() => setStrategy(st.id)} style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 7, marginBottom: 4,
                  background: strategy === st.id ? 'rgba(0,230,118,0.06)' : 'transparent',
                  border: strategy === st.id ? '1px solid rgba(0,230,118,0.2)' : '1px solid transparent',
                  cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: strategy === st.id ? '#e8eaf0' : '#8892a4' }}>{st.label}</div>
                  <div style={{ fontSize: 11, color: '#4a5568' }}>{st.desc}</div>
                </button>
              ))}
            </div>

            {[
              { label: 'Initial Stake ($)', val: initialStake, set: setInitialStake },
              { label: 'Max Stake ($)', val: maxStake, set: setMaxStake },
              { label: 'Max Loss ($)', val: maxLoss, set: setMaxLoss },
              { label: 'Take Profit ($)', val: takeProfit, set: setTakeProfit },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{f.label}</div>
                <input type="number" value={f.val} onChange={e => f.set(e.target.value)} style={inp} />
              </div>
            ))}

            {['CALL', 'PUT'].includes(contract) && (
              <div>
                <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Duration (ticks)</div>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} style={inp} />
              </div>
            )}
            {contract === 'ACCU' && (
              <div>
                <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Growth Rate (%)</div>
                <input type="number" value={growthRate} onChange={e => setGrowthRate(e.target.value)} style={inp} min="1" max="5" />
              </div>
            )}
            {['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER'].includes(contract) && (
              <div>
                <div style={{ fontSize: 10, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Digit (0-9)</div>
                <input type="number" value={digit} onChange={e => setDigit(e.target.value)} style={inp} min="0" max="9" />
              </div>
            )}

            <button onClick={generate} style={{
              padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: 'linear-gradient(135deg,#00e676,#00b0ff)', color: '#000',
              border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            }}>⚡ Generate Bot XML</button>
          </div>

          {/* XML Output */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 20, gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0' }}>Generated XML</div>
              {xml && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={copyXml} style={{
                    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                    background: copied ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#00e676' : '#e8eaf0',
                    cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  }}>{copied ? '✓ Copied' : '📋 Copy'}</button>
                  <button onClick={downloadXml} style={{
                    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                    background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)',
                    color: '#00e676', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  }}>⬇ Download .xml</button>
                  <button onClick={openInDBot} style={{
                    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                    background: 'rgba(41,121,255,0.1)', border: '1px solid rgba(41,121,255,0.3)',
                    color: '#2979ff', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  }}>🤖 Open in Deriv Bot</button>
                </div>
              )}
            </div>

            {!xml ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                <div style={{ fontSize: 48 }}>🤖</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#e8eaf0' }}>Configure your bot</div>
                <div style={{ fontSize: 13, color: '#4a5568', textAlign: 'center', maxWidth: 360 }}>
                  Set your symbol, contract type, strategy and stake parameters on the left, then click Generate Bot XML.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, width: '100%', maxWidth: 300 }}>
                  {['Select your Volatility Index symbol', 'Choose Rise/Fall, Digits, or Accumulator', 'Pick a money management strategy', 'Set your stake and loss limits', 'Click Generate — download the XML', 'Upload to Deriv Bot and run'].map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#00e676', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: '#8892a4' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#00e676' }}>
                  ✓ XML generated for <strong>{SYMBOLS.find(s => s.id === symbol)?.label}</strong> — <strong>{CONTRACT_TYPES.find(c => c.id === contract)?.label}</strong> — <strong>{STRATEGIES.find(s => s.id === strategy)?.label}</strong> strategy
                </div>
                <pre style={{
                  flex: 1, overflow: 'auto', background: '#0d1117',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
                  padding: 16, fontSize: 11, color: '#8892a4',
                  fontFamily: 'Monaco, Consolas, monospace', lineHeight: 1.6,
                  margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>{xml}</pre>
                <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0', marginBottom: 8 }}>How to use this bot:</div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    {['1. Download the XML file above', '2. Go to Deriv Bot (click "Open in Deriv Bot")', '3. Click "Import from computer"', '4. Select your downloaded XML file', '5. Click Run to start the bot'].map((s, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#4a5568', flex: 1 }}>{s}</div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
