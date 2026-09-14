import {
  PROJECT_NAME,
  CONTRACT_CLASS,
  CONTRACT_VERSION,
  CONTRACT_ADDRESS,
  CONTRACT_EXPLORER_URL,
  FROZEN_SOURCE_SHA256,
  NETWORK_LABEL,
  VERDICTS,
} from './config.js?v=6'
import {
  cleanError,
  connectWallet,
  currentWallet,
  readAttempt,
  readBaseline,
  readConfig,
  readGovernance,
  shortAddress,
  submitWrite,
  txExplorerUrl,
  waitForAuthoritativeExecution,
} from './genlayer.js?v=6'
import {
  verifyProposalPostcondition,
  verifyRollbackPostcondition,
} from './tx-truth.js?v=6'
import { loadAttemptHistory } from './audit-history.js?v=6'

const app = document.querySelector('#app')

const state = {
  route: routeFromHash(),
  account: null,
  config: null,
  configError: '',
  selectedBaselineId: localStorage.getItem('mutualframe.baselineId') || '',
  baseline: null,
  attempts: [],
  activeGovernance: null,
  auditFrom: 1,
  auditCount: 12,
  auditLoading: false,
  auditLoaded: false,
  auditError: '',
  busy: false,
  tx: null,
  notice: null,
}

function routeFromHash() {
  const value = location.hash.replace(/^#\/?/, '').split('?')[0]
  return ['overview', 'create', 'governance', 'audit', 'verification'].includes(value) ? value : 'overview'
}

function h(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function n(value, fallback = 0) {
  const out = Number(value)
  return Number.isFinite(out) ? out : fallback
}

function clip(value, max = 90) {
  const text = String(value || '')
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function navItem(route, label, kicker) {
  return `<a class="nav-item ${state.route === route ? 'active' : ''}" href="#/${route}">
    <span class="nav-kicker">${h(kicker)}</span><span>${h(label)}</span>
  </a>`
}

function verdictMeta(verdict) {
  if (verdict === VERDICTS.MUTUAL) return { label: 'Mutual control', tone: 'good', mark: '↔' }
  if (verdict === VERDICTS.UNILATERAL) return { label: 'Unilateral power', tone: 'bad', mark: '→' }
  if (verdict === VERDICTS.DIRECT) return { label: 'Direct rewrite', tone: 'warn', mark: '×' }
  return { label: verdict || 'Unknown', tone: 'neutral', mark: '?' }
}

function shell(content) {
  const accountLabel = state.account ? shortAddress(state.account, 8, 6) : 'Connect wallet'
  const count = state.config ? n(state.config.baseline_count) : '—'
  const versions = state.config ? n(state.config.governance_count) : '—'
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#/overview" aria-label="MutualFrame home">
          <span class="brand-mark"><i></i><i></i></span>
          <span><strong>${PROJECT_NAME}</strong><small>shared change control</small></span>
        </a>
        <nav>
          ${navItem('overview', 'Overview', 'Protocol')}
          ${navItem('create', 'Create baseline', 'Baseline')}
          ${navItem('governance', 'Governance gate', 'Change')}
          ${navItem('audit', 'Attempt log', 'Audit')}
          ${navItem('verification', 'Verification', 'Proof')}
        </nav>
        <div class="sidebar-foot">
          <div class="network-line"><span class="live-dot"></span>${NETWORK_LABEL}</div>
          <a href="${CONTRACT_EXPLORER_URL}" target="_blank" rel="noreferrer">StudioNet explorer ↗</a>
        </div>
      </aside>
      <main>
        <header class="topbar">
          <div class="topbar-inner">
            <div class="contract-chip">
              <span>Project contract</span>
              <a href="${CONTRACT_EXPLORER_URL}" target="_blank" rel="noreferrer">${shortAddress(CONTRACT_ADDRESS, 9, 7)}</a>
              <button class="copy-button" data-copy="${CONTRACT_ADDRESS}">copy</button>
            </div>
            <div class="top-metrics"><span>${count} baselines</span><span>${versions} governance versions</span></div>
            <button class="wallet-button ${state.account ? 'connected' : ''}" id="walletButton"><span class="wallet-dot"></span>${h(accountLabel)}</button>
          </div>
        </header>
        <div class="page page-${state.route}">${content}</div>
      </main>
      ${renderTxDock()}
    </div>`
}

function renderTxDock() {
  if (!state.tx && !state.notice) return ''
  const tx = state.tx
  const notice = state.notice
  if (tx) {
    const tone = tx.phase === 'verified' ? 'success' : tx.phase === 'rollback' ? 'error' : tx.phase === 'delayed' ? 'warn' : 'pending'
    return `<aside class="tx-dock ${tone}">
      <button class="tx-close" id="txClose">×</button>
      <div class="tx-label">${h(tx.label || 'Transaction')}</div>
      <strong>${h(tx.title)}</strong>
      <p>${h(tx.message || '')}</p>
      ${tx.hash ? `<a href="${txExplorerUrl(tx.hash)}" target="_blank" rel="noreferrer">${shortAddress(tx.hash, 12, 8)} ↗</a>` : ''}
      ${tx.detail ? `<small>${h(tx.detail)}</small>` : ''}
    </aside>`
  }
  return `<aside class="tx-dock info"><button class="tx-close" id="txClose">×</button><strong>${h(notice.title)}</strong><p>${h(notice.message)}</p></aside>`
}

function overviewPage() {
  const config = state.config
  const loadingCopy = state.configError ? 'Live read unavailable' : config ? `v${h(config.version)}` : 'checking live contract'
  return `
    <section class="hero editorial-grid">
      <div class="hero-copy">
        <div class="eyebrow">IMMUTABLE BASELINE · SHARED CONTROL</div>
        <h1>Change the rule.<br><em>Not the authority.</em></h1>
        <p class="hero-lede">MutualFrame keeps an original obligation fixed while GenLayer validators answer one narrow question about the clause that governs future change. Mutual control may activate. Unilateral power and direct rewrites are blocked.</p>
        <div class="hero-actions">
          <a class="button primary" href="#/create">Create baseline <span>→</span></a>
          <a class="button ghost" href="#/governance">Inspect a gate</a>
        </div>
      </div>
      <div class="hero-panel">
        <div class="panel-top"><span>Baseline → governance</span><span class="mono">v1.3</span></div>
        <div class="flow-row">
          <div class="flow-node baseline-node"><small>IMMUTABLE</small><strong>Original duty</strong><span>fixed comparison point</span></div>
          <div class="flow-arrow">→</div>
          <div class="semantic-orb"><span>?</span><small>semantic<br>gate</small></div>
        </div>
        <div class="verdict-grid">
          <div class="verdict-card good"><small>ACTIVATE</small><strong>Mutual control</strong><span>clause requires mutual approval for later change</span></div>
          <div class="verdict-card bad"><small>BLOCK</small><strong>Unilateral power</strong><span>one side can change alone</span></div>
          <div class="verdict-card warn"><small>BLOCK</small><strong>Direct rewrite</strong><span>not a future change-control rule</span></div>
        </div>
      </div>
    </section>
    <section class="metric-strip">
      <article><small>LIVE CONTRACT</small><strong>${shortAddress(CONTRACT_ADDRESS, 8, 6)}</strong><span>${loadingCopy}</span></article>
      <article><small>BASELINES</small><strong>${config ? n(config.baseline_count) : '—'}</strong><span>immutable records</span></article>
      <article><small>GOVERNANCE</small><strong>${config ? n(config.governance_count) : '—'}</strong><span>accepted versions</span></article>
      <article><small>ATTEMPT CAP</small><strong>${config ? n(config.max_attempts_per_baseline) : '—'}</strong><span>per baseline</span></article>
    </section>
    <section class="two-column-cards">
      <article class="paper-card">
        <div class="section-index">01 — THE BOUNDARY</div>
        <h2>One semantic question. Deterministic consequence.</h2>
        <p>The model classifies only the practical change-control authority created by a candidate clause. Authorization, counters, version creation, activation and rejection remain deterministic contract logic.</p>
        <div class="mini-rule"><span>semantic</span><b>What kind of future-change authority does this clause create?</b></div>
        <div class="mini-rule"><span>deterministic</span><b>Who may submit, what activates, what stays blocked.</b></div>
      </article>
      <article class="paper-card dark-card">
        <div class="section-index">02 — NOT AN ORACLE</div>
        <h2>The gate registers governance. It does not enforce the world.</h2>
        <p>MutualFrame does not execute later amendments, collect two-party signatures for them, prove off-chain compliance, or decide whether a commercial amendment is fair.</p>
        <a href="#/verification">See verification boundary →</a>
      </article>
    </section>`
}

function createPage() {
  return `
    <section class="page-heading compact-heading">
      <div><div class="eyebrow">BASELINE · IMMUTABLE RECORD</div><h1>Set the thing<br><em>that must not drift.</em></h1></div>
      <p>Creating a baseline records the connected wallet as its authority. The text is trimmed once and then becomes the fixed semantic comparison point for every governance proposal under that baseline.</p>
    </section>
    <section class="form-layout">
      <form class="form-card" id="createBaselineForm">
        <div class="form-card-head"><span>New baseline</span><span class="mono">max 4,000 chars</span></div>
        <label for="baselineText">Immutable obligation</label>
        <textarea id="baselineText" name="baselineText" rows="9" maxlength="4000" placeholder="Enter the original obligation…" required></textarea>
        <div class="form-meta"><span id="baselineCount">0 / 4,000</span><span>${state.account ? `Authority ${shortAddress(state.account, 8, 6)}` : 'Connect a wallet to create'}</span></div>
        <button class="button primary full" type="submit" ${state.busy ? 'disabled' : ''}>Create immutable baseline <span>→</span></button>
      </form>
      <aside class="instruction-card">
        <div class="section-index">WHAT HAPPENS</div>
        <ol>
          <li><span>1</span><p><b>Authority is fixed.</b> Only the creator wallet may propose governance for this baseline.</p></li>
          <li><span>2</span><p><b>Text is immutable.</b> Future semantic comparisons always anchor to this original baseline.</p></li>
          <li><span>3</span><p><b>No governance starts active.</b> A candidate must pass the mutual-control gate first.</p></li>
        </ol>
        <div class="boundary-note">No demo text is prefilled. The transaction uses exactly what you enter.</div>
      </aside>
    </section>`
}

function governancePage() {
  const b = state.baseline
  return `
    <section class="page-heading compact-heading">
      <div><div class="eyebrow">CHANGE · SEMANTIC GATE</div><h1>Who controls<br><em>the next change?</em></h1></div>
      <p>Load a baseline, then submit a candidate governance clause. The candidate must itself define how future material changes become applicable; a direct rewrite is deliberately out of scope.</p>
    </section>
    <section class="workspace-grid">
      <div class="workspace-main">
        <form class="lookup-row" id="baselineLookupForm">
          <label>Baseline ID<input id="baselineLookup" inputmode="numeric" min="1" value="${h(state.selectedBaselineId)}" placeholder="1" /></label>
          <button class="button ghost" type="submit">Load baseline</button>
        </form>
        ${b ? renderBaselineCard(b) : `<div class="empty-card"><strong>No baseline loaded.</strong><span>Enter an ID above or create a new immutable baseline first.</span></div>`}
        <form class="proposal-card" id="proposalForm">
          <div class="form-card-head"><span>Candidate governance clause</span><span class="mono">semantic write</span></div>
          <textarea id="candidateClause" rows="7" maxlength="4000" placeholder="Describe the mechanism that controls future material changes…" required ${b ? '' : 'disabled'}></textarea>
          <div class="proposal-foot"><span>Compared to baseline #${b ? h(b.baseline_id) : '—'}</span><button class="button primary" type="submit" ${!b || state.busy ? 'disabled' : ''}>Run governance gate <span>→</span></button></div>
        </form>
      </div>
      <aside class="verdict-legend">
        <div class="section-index">THREE OUTCOMES</div>
        <div class="legend-row good"><i>↔</i><div><strong>Mutual control</strong><span>Activates a new governance version.</span></div></div>
        <div class="legend-row bad"><i>→</i><div><strong>Unilateral power</strong><span>Blocked and counted. Active governance stays unchanged.</span></div></div>
        <div class="legend-row warn"><i>×</i><div><strong>Direct rewrite</strong><span>Blocked as outside this contract’s governance scope.</span></div></div>
        <div class="boundary-note">If a finalized receipt does not expose execution status, MutualFrame checks the authoritative leader receipt before showing success.</div>
      </aside>
    </section>`
}

function renderBaselineCard(b) {
  const isAuthority = state.account && String(state.account).toLowerCase() === String(b.authority).toLowerCase()
  return `<article class="baseline-card">
    <div class="baseline-head"><div><small>BASELINE #${h(b.baseline_id)}</small><strong>${isAuthority ? 'You are the authority' : 'Read-only observer'}</strong></div><span class="status-pill ${isAuthority ? 'good' : ''}">${shortAddress(b.authority, 8, 6)}</span></div>
    <blockquote>${h(b.baseline_text)}</blockquote>
    <div class="baseline-stats">
      <span><small>ACTIVE VERSION</small><b>${n(b.active_version)}</b></span>
      <span><small>ATTEMPTS</small><b>${n(b.attempt_count)}</b></span>
      <span><small>UNILATERAL BLOCKS</small><b>${n(b.unilateral_power_blocks)}</b></span>
      <span><small>DIRECT BLOCKS</small><b>${n(b.out_of_scope_blocks)}</b></span>
    </div>
    ${b.active_governance_text ? `<div class="active-rule"><small>ACTIVE GOVERNANCE</small><p>${h(b.active_governance_text)}</p></div>` : `<div class="active-rule empty"><small>ACTIVE GOVERNANCE</small><p>No governance clause has been activated yet.</p></div>`}
  </article>`
}

function auditPage() {
  let body = `<div class="empty-card"><strong>No attempt data loaded.</strong><span>Choose a baseline and load its on-chain history.</span></div>`
  if (state.auditLoading) {
    body = `<div class="empty-card"><strong>Loading on-chain attempts…</strong><span>Reading the baseline count and exact attempt records.</span></div>`
  } else if (state.auditError) {
    body = `<div class="empty-card"><strong>Attempt history read failed.</strong><span>${h(state.auditError)}</span></div>`
  } else if (state.auditLoaded && state.attempts.length === 0) {
    body = `<div class="empty-card"><strong>No attempts in this range.</strong><span>The baseline was read successfully, but no attempt IDs exist in the requested range.</span></div>`
  } else if (state.attempts.length) {
    body = `<div class="attempt-table">${state.attempts.map(renderAttemptRow).join('')}</div>`
  }

  return `
    <section class="page-heading compact-heading">
      <div><div class="eyebrow">AUDIT · ATTEMPT HISTORY</div><h1>Every gate result,<br><em>in order.</em></h1></div>
      <p>Inspect the append-only attempt log for a baseline. Cached classifications are disclosed per attempt; accepted candidates point to the governance version they created.</p>
    </section>
    <section class="audit-shell">
      <div class="audit-controls" id="auditControls">
        <label>Baseline ID<input id="auditBaselineId" inputmode="numeric" min="1" value="${h(state.selectedBaselineId)}" placeholder="1" /></label>
        <label>From attempt<input id="auditFrom" inputmode="numeric" min="1" value="${h(state.auditFrom)}" /></label>
        <label>Count<input id="auditCount" inputmode="numeric" min="1" max="50" value="${h(state.auditCount)}" /></label>
        <button class="button primary" id="auditLoadButton" type="button" ${state.auditLoading ? 'disabled' : ''}>${state.auditLoading ? 'Loading…' : 'Load attempts'}</button>
      </div>
      ${body}
    </section>`
}

function renderAttemptRow(a) {
  const meta = verdictMeta(a.verdict)
  return `<article class="attempt-row">
    <div class="attempt-id">#${h(a.attempt_id)}</div>
    <div class="verdict-icon ${meta.tone}">${meta.mark}</div>
    <div class="attempt-copy"><strong>${h(meta.label)}</strong><span class="mono">${h(a.verdict)}</span></div>
    <div class="attempt-result"><span class="status-pill ${a.accepted ? 'good' : meta.tone}">${a.accepted ? 'activated' : 'blocked'}</span>${a.used_cache ? '<span class="cache-pill">cache hit</span>' : '<span class="cache-pill muted">fresh</span>'}</div>
    <button class="detail-button" data-attempt="${h(a.attempt_id)}">inspect</button>
  </article>`
}

function verificationPage() {
  return `
    <section class="page-heading compact-heading">
      <div><div class="eyebrow">PROOF · REVIEWER SURFACE</div><h1>Verify the gate.<br><em>Not the marketing.</em></h1></div>
      <p>The reviewer surface separates deployment identity, frozen source, deterministic limits and honest scope. Project runtime evidence should be collected against this fresh Project address.</p>
    </section>
    <section class="verification-grid">
      <article class="verify-card featured">
        <small>PROJECT DEPLOYMENT</small>
        <strong>${CONTRACT_ADDRESS}</strong>
        <div class="verify-line"><span>Network</span><b>${NETWORK_LABEL}</b></div>
        <div class="verify-line"><span>Contract class</span><b>${CONTRACT_CLASS}</b></div>
        <div class="verify-line"><span>Contract version</span><b>${CONTRACT_VERSION}</b></div>
        <a href="${CONTRACT_EXPLORER_URL}" target="_blank" rel="noreferrer">Open StudioNet Explorer ↗</a>
      </article>
      <article class="verify-card">
        <small>FROZEN SOURCE</small>
        <strong class="hash">${FROZEN_SOURCE_SHA256}</strong>
        <p>The Project repository keeps the frozen implementation under the product-facing filename <code>contract/MutualFrame.py</code>; the Python class remains <code>UnilateralChangeGuard</code>.</p>
      </article>
      <article class="verify-card">
        <small>EXECUTION TRUTH</small>
        <div class="truth-stack"><span>SUBMITTED</span><i>≠</i><span>FINALIZED</span><i>≠</i><span>EXECUTION SUCCESS</span><i>≠</i><span>POSTCONDITION PASS</span></div>
        <p>The UI does not turn a pending or metadata-incomplete receipt into a green success state.</p>
      </article>
      <article class="verify-card">
        <small>HONEST SCOPE</small>
        <p>MutualFrame registers which governance clause is active for an immutable baseline. It does not collect later bilateral signatures, execute amendments, prove off-chain compliance, or verify external facts.</p>
      </article>
    </section>
    <section class="review-path paper-card">
      <div class="section-index">EXACT REVIEW PATH</div>
      <ol>
        <li>Open the Project deployment and confirm GenVM deploy execution succeeded.</li>
        <li>Load <code>get_config()</code>: version 1.3, three closed semantic verdicts.</li>
        <li>Create an empty-state baseline from the connected authority wallet.</li>
        <li>Submit one unilateral future-change clause and verify it is blocked.</li>
        <li>Submit one mutual future-change clause and verify version 1 activates.</li>
        <li>Submit a direct rewrite and verify active governance remains unchanged.</li>
        <li>Repeat the unilateral candidate and verify <code>used_cache = true</code>.</li>
        <li>Switch wallets and verify outsider proposal rolls back with unchanged state.</li>
      </ol>
    </section>`
}

function pageContent() {
  if (state.route === 'create') return createPage()
  if (state.route === 'governance') return governancePage()
  if (state.route === 'audit') return auditPage()
  if (state.route === 'verification') return verificationPage()
  return overviewPage()
}

function render() {
  app.innerHTML = shell(pageContent())
  bindCommon()
  bindPage()
}

function bindCommon() {
  document.querySelector('#walletButton')?.addEventListener('click', handleWallet)
  document.querySelector('#txClose')?.addEventListener('click', () => {
    state.tx = null
    state.notice = null
    render()
  })
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(button.dataset.copy)
      button.textContent = 'copied'
      setTimeout(() => { button.textContent = 'copy' }, 1200)
    })
  })
}

function bindPage() {
  if (state.route === 'create') {
    const textarea = document.querySelector('#baselineText')
    textarea?.addEventListener('input', () => {
      const counter = document.querySelector('#baselineCount')
      if (counter) counter.textContent = `${textarea.value.length.toLocaleString()} / 4,000`
    })
    document.querySelector('#createBaselineForm')?.addEventListener('submit', handleCreateBaseline)
  }

  if (state.route === 'governance') {
    document.querySelector('#baselineLookupForm')?.addEventListener('submit', handleLoadBaseline)
    document.querySelector('#proposalForm')?.addEventListener('submit', handleProposal)
  }

  if (state.route === 'audit') {
    document.querySelector('#auditLoadButton')?.addEventListener('click', handleAudit)
    document.querySelectorAll('[data-attempt]').forEach((button) => button.addEventListener('click', () => inspectAttempt(button.dataset.attempt)))
  }
}

async function handleWallet() {
  try {
    const result = await connectWallet()
    state.account = result.account
    state.notice = { title: 'Wallet connected', message: `${shortAddress(result.account, 10, 8)} is connected to StudioNet.` }
    if (state.baseline) await loadBaseline(state.baseline.baseline_id, false)
  } catch (error) {
    state.notice = { title: 'Wallet connection failed', message: cleanError(error) }
  }
  render()
}

async function handleCreateBaseline(event) {
  event.preventDefault()
  const text = document.querySelector('#baselineText')?.value || ''
  if (!text.trim()) return

  try {
    state.busy = true
    render()
    const { account, client } = await connectWallet()
    state.account = account
    const beforeConfig = await readConfig()
    const hash = await submitWrite(client, 'create_baseline', [text])
    state.tx = { phase: 'submitted', label: 'Create baseline', title: 'Transaction submitted', message: 'Waiting for finalization before reading the new baseline.', hash }
    render()

    const final = await waitForAuthoritativeExecution(hash, ({ message }) => {
      state.tx = { ...state.tx, phase: 'pending', title: 'Confirmation in progress', message }
      render()
    })

    if (final.outcome.ok === null) {
      state.tx = { ...state.tx, phase: 'delayed', title: 'Confirmation delayed', message: final.reason }
      return
    }
    if (final.outcome.ok === false) {
      state.tx = { ...state.tx, phase: 'rollback', title: 'Transaction rolled back', message: final.reason }
      return
    }

    const afterConfig = await readConfig()
    const newId = n(afterConfig.baseline_count)
    const baseline = await readBaseline(newId)
    const expectedId = n(beforeConfig.baseline_count) + 1
    const postOk = newId === expectedId
      && String(baseline.authority).toLowerCase() === String(account).toLowerCase()
      && String(baseline.baseline_text) === text.trim()
      && n(baseline.attempt_count) === 0
      && n(baseline.version_count) === 0

    state.config = afterConfig
    state.selectedBaselineId = String(newId)
    state.baseline = baseline
    localStorage.setItem('mutualframe.baselineId', state.selectedBaselineId)
    state.tx = {
      ...state.tx,
      phase: postOk ? 'verified' : 'delayed',
      title: postOk ? `Baseline #${newId} verified` : 'Execution succeeded; postcondition needs review',
      message: postOk ? 'Authority, immutable text and zeroed governance state match the expected postcondition.' : 'The transaction executed, but the observed baseline did not match every expected field.',
    }
    if (postOk) location.hash = '#/governance'
  } catch (error) {
    state.tx = { phase: 'rollback', label: 'Create baseline', title: 'Write failed', message: cleanError(error) }
  } finally {
    state.busy = false
    render()
  }
}

async function handleLoadBaseline(event) {
  event.preventDefault()
  const id = document.querySelector('#baselineLookup')?.value
  await loadBaseline(id, true)
}

async function loadBaseline(id, rerender = true) {
  if (!id || n(id) <= 0) return
  try {
    const baseline = await readBaseline(id)
    state.selectedBaselineId = String(id)
    state.baseline = baseline
    localStorage.setItem('mutualframe.baselineId', String(id))
    if (n(baseline.active_governance_id) > 0) {
      state.activeGovernance = await readGovernance(baseline.active_governance_id)
    } else {
      state.activeGovernance = null
    }
    state.notice = null
  } catch (error) {
    state.baseline = null
    state.notice = { title: 'Baseline read failed', message: cleanError(error) }
  }
  if (rerender) render()
}

async function handleProposal(event) {
  event.preventDefault()
  if (!state.baseline) return
  const candidate = document.querySelector('#candidateClause')?.value || ''
  if (!candidate.trim()) return

  const baselineId = n(state.baseline.baseline_id)
  let before = null
  try {
    state.busy = true
    const { account, client } = await connectWallet()
    state.account = account
    before = await readBaseline(baselineId)

    const hash = await submitWrite(client, 'propose_governance', [baselineId, candidate])
    state.tx = { phase: 'submitted', label: `Baseline #${baselineId}`, title: 'Governance proposal submitted', message: 'Waiting for finalization and execution evidence.', hash }
    render()

    const final = await waitForAuthoritativeExecution(hash, ({ message }) => {
      state.tx = { ...state.tx, phase: 'pending', title: 'Consensus in progress', message }
      render()
    })

    if (final.outcome.ok === null) {
      state.tx = { ...state.tx, phase: 'delayed', title: 'Confirmation delayed', message: final.reason }
      return
    }

    const after = await readBaseline(baselineId)
    state.baseline = after

    if (final.outcome.ok === false) {
      const rollback = verifyRollbackPostcondition(before, after)
      state.tx = {
        ...state.tx,
        phase: 'rollback',
        title: rollback.ok ? 'Rollback confirmed' : 'Execution error — state review required',
        message: final.reason,
        detail: rollback.message,
      }
      return
    }

    const attempt = await readAttempt(baselineId, after.attempt_count)
    const post = verifyProposalPostcondition(before, after, attempt)
    const meta = verdictMeta(attempt.verdict)
    state.tx = {
      ...state.tx,
      phase: post.ok ? 'verified' : 'delayed',
      title: post.ok ? `${meta.label} · postcondition verified` : `${meta.label} · postcondition mismatch`,
      message: post.message,
      detail: attempt.used_cache ? 'Classification source: cached verdict.' : 'Classification source: fresh semantic consensus.',
    }
  } catch (error) {
    try {
      const after = before ? await readBaseline(baselineId) : null
      const rollback = before && after ? verifyRollbackPostcondition(before, after) : null
      state.baseline = after || state.baseline
      state.tx = {
        phase: 'rollback',
        label: `Baseline #${baselineId}`,
        title: rollback?.ok ? 'Write rejected · rollback confirmed' : 'Write failed',
        message: cleanError(error),
        detail: rollback?.message || '',
      }
    } catch {
      state.tx = { phase: 'rollback', label: `Baseline #${baselineId}`, title: 'Write failed', message: cleanError(error) }
    }
  } finally {
    state.busy = false
    render()
  }
}

async function handleAudit() {
  const baselineId = document.querySelector('#auditBaselineId')?.value
  const from = n(document.querySelector('#auditFrom')?.value, 1)
  const count = n(document.querySelector('#auditCount')?.value, 12)
  if (!baselineId || n(baselineId) <= 0) {
    state.auditError = 'Enter a valid baseline ID.'
    state.auditLoaded = false
    render()
    return
  }

  state.selectedBaselineId = String(baselineId)
  state.auditFrom = from
  state.auditCount = count
  state.auditLoading = true
  state.auditLoaded = false
  state.auditError = ''
  state.attempts = []
  localStorage.setItem('mutualframe.baselineId', state.selectedBaselineId)
  render()

  try {
    const loaded = await loadAttemptHistory(
      { readBaseline, readAttempt },
      baselineId,
      from,
      count,
    )
    state.baseline = loaded.baseline
    state.attempts = loaded.items
    state.auditLoaded = true
    state.notice = null
  } catch (error) {
    state.attempts = []
    state.auditLoaded = false
    state.auditError = cleanError(error)
  } finally {
    state.auditLoading = false
    render()
  }
}

async function inspectAttempt(attemptId) {
  try {
    const a = await readAttempt(state.selectedBaselineId, attemptId)
    const meta = verdictMeta(a.verdict)
    state.notice = {
      title: `Attempt #${attemptId} · ${meta.label}`,
      message: `${a.accepted ? 'Activated governance' : 'Blocked'} · ${a.used_cache ? 'cache hit' : 'fresh semantic evaluation'} · resulting governance ${a.resulting_governance_id || 0}.`,
    }
  } catch (error) {
    state.notice = { title: 'Attempt read failed', message: cleanError(error) }
  }
  render()
}

async function bootstrap() {
  render()
  try {
    state.account = await currentWallet()
  } catch {}
  try {
    state.config = await readConfig()
    state.configError = ''
  } catch (error) {
    state.configError = cleanError(error)
  }
  render()
}

window.addEventListener('hashchange', () => {
  state.route = routeFromHash()
  state.notice = null
  render()
})

window.ethereum?.on?.('accountsChanged', (accounts) => {
  state.account = accounts?.[0] || null
  render()
})

bootstrap()
