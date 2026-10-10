import { initialSession, transition } from './core/session.mjs';
import { locate, LIMITS, failure } from './core/lexer.mjs';
import { createExporter } from './core/export.mjs';
import { WORKER_SOURCE } from './worker-source.mjs';
import { locales } from './locales.mjs';
const locale = document.documentElement.lang === 'en' ? 'en' : 'zh-Hant';
const messages = locales[locale];
const numberFormat = new Intl.NumberFormat(locale,{useGrouping:false});

const source = document.querySelector('#source');
const output = document.querySelector('#output');
const run = document.querySelector('#run');
const cancel = document.querySelector('#cancel');
const clear = document.querySelector('#clear');
const copy = document.querySelector('#copy');
const download = document.querySelector('#download');
const status = document.querySelector('#status');
const exportStatus = document.querySelector('#export-status');
const radios = [...document.querySelectorAll('input[name="mode"]')];
let session = initialSession();
let worker = null;
let workerURL = null;
let watchdog = null;
let copying = false;
const exporter = createExporter({
  clipboard:navigator.clipboard,
  triggerDownload:(url,name) => {
    const link = document.createElement('a');
    link.href = url; link.download = name;
    document.body.append(link); link.click(); link.remove();
  },
});

function stopWork() {
  if (worker) worker.terminate();
  worker = null;
  if (workerURL !== null) URL.revokeObjectURL(workerURL);
  workerURL = null;
  if (watchdog !== null) clearTimeout(watchdog);
  watchdog = null;
}
function render() {
  output.value = session.text;
  run.disabled = session.status === 'running';
  run.textContent = session.status === 'running' ? messages.busy : messages.check;
  cancel.disabled = session.status !== 'running';
  copy.disabled = session.status !== 'success' || copying;
  download.disabled = session.status !== 'success';
  radios.forEach(radio => { radio.checked = radio.value === session.mode; });
  source.setAttribute('aria-invalid',String(session.status === 'error' && session.error?.offset !== null));
  status.dataset.state = session.status;
  if (session.error) {
    let text = `! ${messages[session.error.code]}`;
    if (session.error.offset !== null) {
      const position = locate(session.source,session.error.offset);
      text += messages.position.replace('{line}',numberFormat.format(position.line)).replace('{column}',numberFormat.format(position.column)).replace('{offset}',numberFormat.format(session.error.offset));
    }
    status.textContent = text;
  } else {
    status.textContent = session.reason === 'cancelled' ? messages.cancelled : messages[session.status];
  }
}
function update(event) {
  if (event.type !== 'RESULT') exporter.release();
  exportStatus.textContent = '';
  session = transition(session,event); render();
}
function complete(jobId,result) {
  if (session.status !== 'running' || jobId !== session.jobId) return;
  stopWork();
  update({type:'RESULT',jobId,result});
}
source.addEventListener('input',() => { stopWork(); update({type:'SOURCE',source:source.value}); });
radios.forEach(radio => radio.addEventListener('change',() => { stopWork(); update({type:'MODE',mode:radio.value}); }));
cancel.addEventListener('click',() => { stopWork(); update({type:'CANCEL'}); });
clear.addEventListener('click',() => { stopWork(); source.value = ''; update({type:'CLEAR'}); source.focus(); });
run.addEventListener('click',() => {
  stopWork(); update({type:'START'});
  const jobId = session.jobId;
  if (typeof Worker !== 'function' || typeof TextEncoder !== 'function' || typeof Blob !== 'function' || typeof URL.createObjectURL !== 'function') return complete(jobId,failure('UNSUPPORTED'));
  if (session.source.length > LIMITS.inputBytes || new TextEncoder().encode(session.source).byteLength > LIMITS.inputBytes) return complete(jobId,failure('INPUT_TOO_LARGE'));
  try {
    workerURL = URL.createObjectURL(new Blob([WORKER_SOURCE],{type:'text/javascript'}));
    worker = new Worker(workerURL,{type:'module'});
    worker.onmessage = event => {
      const data = event.data;
      if (!data || data.type !== 'result' || data.jobId !== jobId) return;
      if (Object.keys(data).length !== 3) return complete(jobId,failure('WORKER_FAILED'));
      complete(jobId,data.result);
    };
    worker.onerror = event => { event.preventDefault(); complete(jobId,failure('WORKER_FAILED')); };
    worker.onmessageerror = () => complete(jobId,failure('WORKER_FAILED'));
    watchdog = setTimeout(() => complete(jobId,failure('TIMEOUT')),5000);
    worker.postMessage({type:'process',jobId,source:session.source,mode:session.mode});
  } catch { complete(jobId,failure('WORKER_FAILED')); }
});
copy.addEventListener('click',async () => {
  if (session.status !== 'success' || copying) return;
  const jobId = session.jobId;
  copying = true; render();
  const copied = await exporter.copy(session.text);
  copying = false; render();
  if (jobId !== session.jobId || session.status !== 'success') return;
  exportStatus.textContent = copied ? messages.copied : messages.copyFailed;
  if (!copied) { output.focus(); output.select(); }
});
download.addEventListener('click',() => {
  if (session.status !== 'success') return;
  const result = exporter.download(session.text);
  exportStatus.textContent = result.ok ? messages.downloaded : messages.downloadFailed;
});
window.addEventListener('pagehide',() => { stopWork(); exporter.release(); source.value = ''; session = transition(session,{type:'CLEAR'}); render(); });
render();
