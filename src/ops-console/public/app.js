const state = {
  dashboard: null,
  runs: [],
  tasks: [],
  selectedRunId: null,
  currentView: 'dashboard'
};

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(payload.error || response.statusText);
  }
  return response.json();
}

function badge(status) {
  return `<span class="badge ${status}">${status}</span>`;
}

function openRun(runId) {
  setView('runs');
  state.selectedRunId = runId;
  renderRuns();
  loadRunDetail(runId);
}

function setView(view) {
  state.currentView = view;
  document.querySelectorAll('.view').forEach((element) => element.classList.toggle('active', element.id === `${view}-view`));
  document.querySelectorAll('.nav-button').forEach((element) => element.classList.toggle('active', element.dataset.view === view));
  document.getElementById('page-title').textContent = view === 'runs' ? 'Runs' : view === 'trigger' ? 'Trigger Workflows' : view === 'tasks' ? 'Tasks' : 'Dashboard';
}

function renderDashboard() {
  const root = document.getElementById('dashboard-content');
  if (!state.dashboard) {
    root.innerHTML = '<div class="empty">Loading dashboard…</div>';
    return;
  }

  const latestCards = Object.values(state.dashboard.latestByKind || {}).map((run) => `
    <div class="stat-card">
      <h3>${run.kind}</h3>
      <p>${run.title}</p>
      <div class="meta">${badge(run.status)}</div>
    </div>
  `).join('');

  const failedRuns = state.dashboard.failedRuns.length
    ? state.dashboard.failedRuns.map((run) => `<li><button class="link-button" data-run-id="${run.id}">${run.title}</button> · ${run.kind}</li>`).join('')
    : '<li class="empty">No failed runs.</li>';

  const tasks = state.dashboard.tasks.length
    ? state.dashboard.tasks.map((task) => `
      <li>
        ${task.label} · ${task.status}
        ${task.latestRunId ? `<button class="inline-button" data-open-task-run="${task.latestRunId}">Open result</button>` : ''}
      </li>
    `).join('')
    : '<li class="empty">No tracked tasks yet.</li>';

  root.innerHTML = `
    <div class="summary-grid">
      <div class="stat-card"><h3>LLM</h3><p>${state.dashboard.runtime.llmConfigured ? 'configured' : 'missing'}</p></div>
      <div class="stat-card"><h3>HF</h3><p>${state.dashboard.runtime.hfConfigured ? 'configured' : 'missing'}</p></div>
      <div class="stat-card"><h3>ffmpeg</h3><p>${state.dashboard.runtime.ffmpegAvailable ? 'available' : 'missing'}</p></div>
      <div class="stat-card"><h3>Tracked tasks</h3><p>${state.dashboard.tasks.length}</p></div>
    </div>
    <div class="dashboard-grid" style="margin-top:16px;">${latestCards}</div>
    <div class="dashboard-grid" style="margin-top:16px; grid-template-columns: 1fr 1fr;">
      <div class="card"><h3>Recent failed runs</h3><ul>${failedRuns}</ul></div>
      <div class="card"><h3>Recent tasks</h3><ul>${tasks}</ul></div>
    </div>
  `;

  root.querySelectorAll('[data-run-id]').forEach((button) => {
    button.addEventListener('click', () => openRun(button.dataset.runId));
  });
  root.querySelectorAll('[data-open-task-run]').forEach((button) => {
    button.addEventListener('click', () => openRun(button.dataset.openTaskRun));
  });
}

function renderRuns() {
  const kindFilter = document.getElementById('run-kind-filter').value;
  const list = document.getElementById('runs-list');
  const items = state.runs.filter((run) => !kindFilter || run.kind === kindFilter);
  if (!items.length) {
    list.innerHTML = '<div class="empty">No runs found.</div>';
    return;
  }
  list.innerHTML = items.map((run) => `
    <div class="run-row">
      <h4>${run.title}</h4>
      <p>${run.subtitle || run.relativeRunDir}</p>
      <div class="meta">
        ${badge(run.status)}
        <span class="badge">${run.kind}</span>
        <span class="badge">${new Date(run.createdAt).toLocaleString()}</span>
      </div>
      <div class="meta" style="margin-top:12px;">
        <button data-open-run="${run.id}">Open</button>
      </div>
    </div>
  `).join('');
  list.querySelectorAll('[data-open-run]').forEach((button) => {
    button.addEventListener('click', () => {
      openRun(button.dataset.openRun);
    });
  });
}

function renderRunDetail(detail) {
  const root = document.getElementById('run-detail');
  const payload = JSON.stringify(detail.payload, null, 2);
  const artifacts = detail.artifacts.length
    ? `<ul>${detail.artifacts.map((artifact) => `<li>${artifact.relativePath} <span class="badge">${artifact.kind}</span></li>`).join('')}</ul>`
    : '<p class="empty">No artifacts found.</p>';
  const textFiles = detail.viewer?.textFiles?.length
    ? detail.viewer.textFiles.map((file) => `<div class="artifact-group"><h3>${file.label}</h3><pre>${file.content}</pre></div>`).join('')
    : '';
  root.classList.remove('empty');
  root.innerHTML = `
    <div class="detail-panel">
      <h3>${detail.title}</h3>
      <p>${detail.subtitle || detail.relativeRunDir}</p>
      <div class="meta">
        ${badge(detail.status)}
        <span class="badge">${detail.kind}</span>
        <span class="badge">${detail.relativeRunDir}</span>
      </div>
      <div class="artifact-group">
        <h3>Artifacts</h3>
        ${artifacts}
      </div>
      ${textFiles}
      <div class="artifact-group">
        <h3>Payload</h3>
        <pre>${payload}</pre>
      </div>
    </div>
  `;
}

function renderTasks() {
  const root = document.getElementById('tasks-list');
  if (!state.tasks.length) {
    root.innerHTML = '<div class="empty">No tasks yet.</div>';
    return;
  }
  root.innerHTML = state.tasks.map((task) => `
    <div class="run-row">
      <h4>${task.label}</h4>
      <p>${task.command} ${task.args.join(' ')}</p>
      <div class="meta">
        ${badge(task.status)}
        <span class="badge">${new Date(task.createdAt).toLocaleString()}</span>
        ${task.latestRunId ? `<button data-open-task-run="${task.latestRunId}">Open result</button>` : ''}
      </div>
      ${task.error ? `<pre>${task.error}</pre>` : ''}
      ${task.stdoutPreview ? `<pre>${task.stdoutPreview}</pre>` : ''}
      ${task.stderrPreview ? `<pre>${task.stderrPreview}</pre>` : ''}
    </div>
  `).join('');
  root.querySelectorAll('[data-open-task-run]').forEach((button) => {
    button.addEventListener('click', () => openRun(button.dataset.openTaskRun));
  });
}

async function loadRunDetail(runId) {
  const detail = await request(`/api/runs/${encodeURIComponent(runId)}`);
  renderRunDetail(detail);
}

async function refreshAll() {
  const [dashboard, runs, tasks] = await Promise.all([
    request('/api/dashboard'),
    request('/api/runs'),
    request('/api/tasks')
  ]);
  state.dashboard = dashboard;
  state.runs = runs.items;
  state.tasks = tasks.items;
  renderDashboard();
  renderRuns();
  renderTasks();
  if (state.selectedRunId) {
    loadRunDetail(state.selectedRunId).catch(() => {});
  }
}

function bindForms() {
  document.getElementById('story-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const task = await request('/api/workflows/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: form.get('topic'),
        platform: form.get('platform'),
        style: form.get('style'),
        dryRun: form.get('dryRun') === 'on'
      })
    });
    document.getElementById('trigger-feedback').innerHTML = `<div class="card">Queued: ${task.label}</div>`;
    refreshAll();
  });

  document.getElementById('execution-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const task = await request('/api/workflows/execution-pack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: Number(form.get('count') || 3),
        platform: form.get('platform'),
        diverseOnly: form.get('diverseOnly') === 'on'
      })
    });
    document.getElementById('trigger-feedback').innerHTML = `<div class="card">Queued: ${task.label}</div>`;
    refreshAll();
  });

  document.getElementById('daily-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const task = await request('/api/workflows/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dryRun: form.get('dryRun') === 'on'
      })
    });
    document.getElementById('trigger-feedback').innerHTML = `<div class="card">Queued: ${task.label}</div>`;
    refreshAll();
  });
}

function bindNavigation() {
  document.querySelectorAll('.nav-button').forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });
  document.getElementById('refresh-button').addEventListener('click', refreshAll);
  document.getElementById('run-kind-filter').addEventListener('change', renderRuns);
}

bindNavigation();
bindForms();
refreshAll();
setInterval(refreshAll, 4000);
