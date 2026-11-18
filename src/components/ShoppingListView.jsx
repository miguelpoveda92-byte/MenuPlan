import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingCart,
  PackageCheck,
  Trash2,
  RotateCcw,
  Plus,
  Copy,
  Printer,
  Check,
  Square,
  CheckSquare,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  ExternalLink,
  Download,
  X,
  Loader2,
  Share2,
  Code2,
} from 'lucide-react';
import {
  DEFAULT_SERVINGS,
  INGREDIENT_CATEGORIES,
  UNITS,
  formatAmount,
  generateId,
} from '../data/initialData';
import {
  DEFAULT_PARTNER_EMAIL,
  SHARED_DRIVE_FOLDER_URL,
  SHARED_DRIVE_DOC_ID,
  SHARED_DRIVE_DOC_URL,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  buildChecklistText,
  buildChecklistHtmlDoc,
  createSharedGoogleDocViaApi,
  exportChecklistViaAppsScript,
} from '../utils/recipeServices';

function GoogleDriveExportModal({ isOpen, onClose, groupedDefinitive, onNotify }) {
  const [exportTab, setExportTab] = useState('quick');
  const [docTitle, setDocTitle] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [partnerEmail, setPartnerEmail] = useState(() => {
    try {
      return window.localStorage.getItem('menuplan_partner_email_v1') || DEFAULT_PARTNER_EMAIL;
    } catch {
      return DEFAULT_PARTNER_EMAIL;
    }
  });
  const [permissionRole, setPermissionRole] = useState('writer');
  const [gasUrl, setGasUrl] = useState(() => {
    try {
      return window.localStorage.getItem('menuplan_gas_url_v1') || '';
    } catch {
      return '';
    }
  });
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sharedResult, setSharedResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toLocaleDateString('es-ES');
    setDocTitle(`Lista de la Compra Checklist (2 personas) - ${today}`);
    setErrorMsg('');
    setSharedResult(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const checklistText = buildChecklistText(groupedDefinitive, DEFAULT_SERVINGS);
  const checklistHtml = buildChecklistHtmlDoc(groupedDefinitive, docTitle);

  const persistPartnerEmail = (val) => {
    setPartnerEmail(val);
    try {
      window.localStorage.setItem('menuplan_partner_email_v1', val.trim());
    } catch {
      // ignore storage error
    }
  };

  const handleCopyAndOpenSharedDoc = async () => {
    try {
      await navigator.clipboard.writeText(checklistText);
      onNotify?.('Checklist copiado. Pégalo en vuestro documento compartido de Google Drive.');
    } catch {
      onNotify?.('Abriendo vuestro documento compartido en Google Drive.');
    }
    window.open(SHARED_DRIVE_DOC_URL, '_blank', 'noopener,noreferrer');
  };

  const handleCopyAndOpenDocs = async () => {
    try {
      await navigator.clipboard.writeText(checklistText);
      onNotify?.('Checklist copiado. Pégalo (Ctrl+V) en el documento de Google Docs que se abrirá.');
    } catch {
      onNotify?.('Abriendo Google Docs. Puedes copiar el checklist desde la vista previa.');
    }
    window.open('https://docs.new', '_blank', 'noopener,noreferrer');
  };

  const handleDownloadForDrive = () => {
    const blob = new Blob(['\ufeff', checklistHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Lista_Compra_Checklist_MenuPlan.doc';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    onNotify?.('Archivo descargado. Súbelo a vuestra carpeta compartida de Google Drive.');
  };

  const handleCreateViaDriveApi = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await createSharedGoogleDocViaApi({
        accessToken,
        title: docTitle.trim() || 'Lista de la Compra - MenuPlan',
        htmlContent: checklistHtml,
        docId: SHARED_DRIVE_DOC_ID,
        partnerEmail,
        permissionRole,
      });
      setSharedResult(res);
      onNotify?.('Documento checklist compartido actualizado en Google Drive');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo sincronizar con Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateViaAppsScript = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      try {
        window.localStorage.setItem('menuplan_gas_url_v1', gasUrl.trim());
      } catch {
        // ignore storage error
      }
      const res = await exportChecklistViaAppsScript({
        scriptUrl: gasUrl,
        title: docTitle.trim() || 'Lista de la Compra - MenuPlan',
        groupedItems: groupedDefinitive,
        docId: SHARED_DRIVE_DOC_ID,
        partnerEmail,
      });
      setSharedResult(res);
      onNotify?.('Documento compartido actualizado en Google Drive');
    } catch (err) {
      setErrorMsg(err.message || 'Error al conectar con Google Apps Script.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = async (txt, msg) => {
    try {
      await navigator.clipboard.writeText(txt);
      onNotify?.(msg);
    } catch {
      onNotify?.('No se pudo copiar al portapapeles');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gdrive-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-emerald-600" />
              <h2 id="gdrive-modal-title" className="text-lg font-bold text-slate-900">
                Exportar Checklist a Google Drive
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Genera un documento compartido en formato checklist con tu lista definitiva (2 personas).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 bg-slate-50 px-5 py-2.5">
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-200/70 p-1">
            <button
              type="button"
              onClick={() => setExportTab('quick')}
              className={`rounded-lg py-1.5 text-xs font-bold transition ${
                exportTab === 'quick'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rápido (Google Docs)
            </button>
            <button
              type="button"
              onClick={() => setExportTab('apps_script')}
              className={`rounded-lg py-1.5 text-xs font-bold transition ${
                exportTab === 'apps_script'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apps Script Auto
            </button>
            <button
              type="button"
              onClick={() => setExportTab('api')}
              className={`rounded-lg py-1.5 text-xs font-bold transition ${
                exportTab === 'api'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Drive API (Token)
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                  Documento y carpeta compartida en tu Google Drive
                </p>
                <p className="mt-0.5 text-xs text-emerald-900">
                  Acceded ambos siempre al mismo checklist desde vuestras cuentas de Google Drive.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <a
                  href={SHARED_DRIVE_DOC_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir Checklist
                </a>
                <a
                  href={SHARED_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Carpeta Drive
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Título del documento
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Email Google de tu novia (opcional)
              </label>
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => persistPartnerEmail(e.target.value)}
                placeholder="ejemplo@gmail.com"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {sharedResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                <Share2 className="h-4 w-4 text-emerald-600" />
                ¡Documento checklist compartido en Google Drive!
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <a
                  href={sharedResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir documento compartido
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyText(sharedResult.url, 'Enlace compartido copiado')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar enlace
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
              {errorMsg}
            </div>
          )}

          {exportTab === 'quick' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleCopyAndOpenSharedDoc}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Copiar y abrir Checklist Compartido
                </button>
                <button
                  type="button"
                  onClick={handleCopyAndOpenDocs}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Nuevo Doc (docs.new)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadForDrive}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  Descargar (.doc)
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Pulsa &ldquo;Copiar y abrir Checklist Compartido&rdquo; para copiar la lista definitiva actual y abrir vuestro Google Doc común (selecciona el contenido anterior y pega con <code>Ctrl+V</code>), o configúralo en la pestaña <strong>Apps Script Auto</strong> para actualizarlo en 1 clic.
              </p>
            </div>
          )}

          {exportTab === 'apps_script' && (
            <form onSubmit={handleCreateViaAppsScript} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  URL de tu Web App de Google Apps Script
                </label>
                <input
                  type="url"
                  required
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowScriptCode((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {showScriptCode ? 'Ocultar código Apps Script' : 'Ver código Apps Script para pegar en script.google.com'}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                  Crear documento compartido
                </button>
              </div>

              {showScriptCode && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-900 p-3 text-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Pégalo en script.google.com → Implementar → Aplicación web (acceso: Cualquier usuario)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(GOOGLE_APPS_SCRIPT_TEMPLATE, 'Código Apps Script copiado')
                      }
                      className="rounded-lg bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-600"
                    >
                      Copiar código
                    </button>
                  </div>
                  <pre className="max-h-44 overflow-auto text-[11px] leading-relaxed text-emerald-300">
                    {GOOGLE_APPS_SCRIPT_TEMPLATE}
                  </pre>
                </div>
              )}
            </form>
          )}

          {exportTab === 'api' && (
            <form onSubmit={handleCreateViaDriveApi} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Token de acceso OAuth 2.0 (scope drive.file)
                </label>
                <input
                  type="password"
                  required
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="ya29.a0..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <select
                  value={permissionRole}
                  onChange={(e) => setPermissionRole(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="reader">Compartir enlace: Solo lectura</option>
                  <option value="writer">Compartir enlace: Puede editar</option>
                </select>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                  Subir y compartir en Google Drive
                </button>
              </div>
            </form>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Vista previa del checklist
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(checklistText, 'Checklist copiado al portapapeles')}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar texto
              </button>
            </div>
            <pre className="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
              {checklistText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShoppingListView({
  shoppingItems,
  shoppingState,
  onMarkAlreadyHave,
  onRestoreIngredient,
  onRestoreAllIngredients,
  onToggleChecked,
  onAddExtraItem,
  onRemoveExtraItem,
  onMoveCheckedToHave,
  onOpenCalendar,
  onNotify,
}) {
  const [subTab, setSubTab] = useState('definitive');
  const [showSources, setShowSources] = useState(true);
  const [copied, setCopied] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);

  const [extraName, setExtraName] = useState('');
  const [extraAmount, setExtraAmount] = useState(1);
  const [extraUnit, setExtraUnit] = useState('ud');
  const [extraCategory, setExtraCategory] = useState(INGREDIENT_CATEGORIES[0].id);

  const alreadyHaveSet = useMemo(
    () => new Set(shoppingState.alreadyHaveIds || []),
    [shoppingState.alreadyHaveIds],
  );

  const checkedSet = useMemo(
    () => new Set(shoppingState.checkedIds || []),
    [shoppingState.checkedIds],
  );

  const definitiveItems = useMemo(
    () => shoppingItems.filter((item) => !alreadyHaveSet.has(item.id)),
    [shoppingItems, alreadyHaveSet],
  );

  const removedItems = useMemo(
    () => shoppingItems.filter((item) => !item.isManual && alreadyHaveSet.has(item.id)),
    [shoppingItems, alreadyHaveSet],
  );

  const checkedCount = useMemo(
    () => definitiveItems.filter((item) => checkedSet.has(item.id)).length,
    [definitiveItems, checkedSet],
  );

  const groupedDefinitive = useMemo(() => {
    const groups = [];
    for (const cat of INGREDIENT_CATEGORIES) {
      const items = definitiveItems.filter((item) => item.category === cat.id);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }
    const knownCatIds = new Set(INGREDIENT_CATEGORIES.map((c) => c.id));
    const otherItems = definitiveItems.filter((item) => !knownCatIds.has(item.category));
    if (otherItems.length > 0) {
      groups.push({
        category: {
          id: 'Otros',
          label: 'Otros',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          dotClass: 'bg-slate-500',
        },
        items: otherItems,
      });
    }
    return groups;
  }, [definitiveItems]);

  const handleAddExtra = (e) => {
    e.preventDefault();
    const clean = extraName.trim();
    if (!clean) return;
    onAddExtraItem({
      id: generateId('extra'),
      name: clean,
      amount: Math.max(0.1, Number(extraAmount) || 1),
      unit: extraUnit,
      category: extraCategory,
    });
    setExtraName('');
    setExtraAmount(1);
  };

  const handleCopyList = async () => {
    if (definitiveItems.length === 0) return;
    const text = buildChecklistText(groupedDefinitive, DEFAULT_SERVINGS);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onNotify?.('Checklist copiado al portapapeles');
      setTimeout(() => setCopied(false), 2200);
    } catch {
      onNotify?.('No se pudo acceder al portapapeles en este navegador');
    }
  };

  return (
    <section className="space-y-5">
      {/* Cabecera y métricas */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Lista de la Compra (2 personas)
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Cantidades ajustadas para 2 personas. Elimina los ingredientes que ya tienes para generar la lista definitiva y expórtala a Google Drive.
            </p>
          </div>

          <div className="no-print flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (definitiveItems.length > 0) {
                  try {
                    const txt = buildChecklistText(groupedDefinitive, DEFAULT_SERVINGS);
                    await navigator.clipboard.writeText(txt);
                    onNotify?.('Checklist copiado. Abriendo vuestro documento compartido en Drive.');
                  } catch {
                    onNotify?.('Abriendo documento compartido en Google Drive.');
                  }
                }
                window.open(SHARED_DRIVE_DOC_URL, '_blank', 'noopener,noreferrer');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Checklist Compartido (Drive)
            </button>
            <button
              type="button"
              onClick={() => setDriveModalOpen(true)}
              disabled={definitiveItems.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CloudUpload className="h-4 w-4" />
              Opciones Drive
            </button>
            <button
              type="button"
              onClick={handleCopyList}
              disabled={definitiveItems.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? '¡Copiada!' : 'Copiar lista'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={definitiveItems.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-4">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Del menú semanal
            </span>
            <span className="mt-0.5 block text-xl font-extrabold text-slate-900 sm:text-2xl">
              {shoppingItems.length}
            </span>
          </div>
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Ya en casa
            </span>
            <span className="mt-0.5 block text-xl font-extrabold text-amber-700 sm:text-2xl">
              {removedItems.length}
            </span>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Lista definitiva
            </span>
            <span className="mt-0.5 block text-xl font-extrabold text-emerald-700 sm:text-2xl">
              {definitiveItems.length}
            </span>
          </div>
        </div>
      </div>

      {/* Selector entre Lista Definitiva y Descartados */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-soft">
          <button
            type="button"
            onClick={() => setSubTab('definitive')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition sm:text-sm ${
              subTab === 'definitive'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Lista definitiva ({definitiveItems.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('already_have')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition sm:text-sm ${
              subTab === 'already_have'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="h-4 w-4" />
            Eliminados / En casa ({removedItems.length})
          </button>
        </div>

        {subTab === 'definitive' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSources((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              {showSources ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showSources ? 'Ocultar platos origen' : 'Ver platos origen'}
            </button>

            {checkedCount > 0 && (
              <button
                type="button"
                onClick={() => onMoveCheckedToHave(definitiveItems.filter((i) => checkedSet.has(i.id)))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-200"
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Quitar marcados ({checkedCount})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Formulario rápido para añadir producto manual a la lista definitiva */}
      {subTab === 'definitive' && (
        <form
          onSubmit={handleAddExtra}
          className="no-print grid grid-cols-12 gap-2 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-soft"
        >
          <input
            type="text"
            value={extraName}
            onChange={(e) => setExtraName(e.target.value)}
            placeholder="Añadir producto extra (ej. Café molido, Servilletas...)"
            className="col-span-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-5"
          />
          <input
            type="number"
            min="0.1"
            step="any"
            value={extraAmount}
            onChange={(e) => setExtraAmount(e.target.value)}
            aria-label="Cantidad"
            className="col-span-4 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none sm:col-span-2"
          />
          <select
            value={extraUnit}
            onChange={(e) => setExtraUnit(e.target.value)}
            aria-label="Unidad"
            className="col-span-4 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none sm:col-span-1"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <select
            value={extraCategory}
            onChange={(e) => setExtraCategory(e.target.value)}
            aria-label="Categoría"
            className="col-span-4 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none sm:col-span-2"
          >
            {INGREDIENT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="col-span-12 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 sm:col-span-2"
          >
            <Plus className="h-4 w-4" />
            Añadir
          </button>
        </form>
      )}

      {/* Contenido principal de la lista */}
      {subTab === 'definitive' ? (
        shoppingItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <ShoppingCart className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 text-base font-bold text-slate-800">
              Tu lista de la compra está vacía
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Añade platos con ingredientes en el Calendario Semanal o agrega productos manualmente arriba.
            </p>
            <button
              type="button"
              onClick={onOpenCalendar}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <CalendarDays className="h-4 w-4" />
              Ir al calendario semanal
            </button>
          </div>
        ) : definitiveItems.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-6 py-10 text-center">
            <PackageCheck className="mx-auto h-10 w-10 text-emerald-600" />
            <h2 className="mt-3 text-base font-bold text-emerald-950">
              ¡Ya tienes todos los ingredientes en casa!
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              Has descartado los {removedItems.length} ingredientes del menú semanal. Puedes revisarlos o restaurar alguno en la pestaña &ldquo;Eliminados / En casa&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setSubTab('already_have')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-100"
            >
              Ver ingredientes eliminados ({removedItems.length})
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {groupedDefinitive.map(({ category, items }) => (
              <div
                key={category.id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-soft"
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${category.dotClass}`} />
                    <h2 className="text-sm font-extrabold text-slate-800">
                      {category.label}
                    </h2>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                    {items.length}
                  </span>
                </div>

                <ul className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const isChecked = checkedSet.has(item.id);
                    return (
                      <li
                        key={item.id}
                        className={`flex items-start justify-between gap-3 px-4 py-3 transition ${
                          isChecked ? 'bg-slate-50/80' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleChecked(item.id)}
                          aria-pressed={isChecked}
                          className="flex flex-1 items-start gap-3 text-left focus:outline-none"
                        >
                          {isChecked ? (
                            <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                          ) : (
                            <Square className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 hover:text-emerald-500" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span
                                className={`text-sm font-bold transition ${
                                  isChecked
                                    ? 'text-slate-400 line-through'
                                    : 'text-slate-900'
                                }`}
                              >
                                {item.name}
                              </span>
                              {item.amount > 0 && (
                                <span
                                  className={`rounded-md px-2 py-0.5 text-xs font-bold transition ${
                                    isChecked
                                      ? 'bg-slate-100 text-slate-400 line-through'
                                      : 'bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  {formatAmount(item.amount)} {item.unit}
                                </span>
                              )}
                            </div>

                            {showSources && item.sources?.length > 0 && (
                              <p className="mt-1 text-[11px] leading-snug text-slate-500">
                                {item.sources.join(' · ')}
                              </p>
                            )}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            item.isManual
                              ? onRemoveExtraItem(item.manualId)
                              : onMarkAlreadyHave(item.id, item.name)
                          }
                          title={
                            item.isManual
                              ? 'Eliminar producto manual'
                              : 'Ya lo tengo en casa (eliminar de la lista definitiva)'
                          }
                          className="no-print inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">
                            {item.isManual ? 'Quitar' : 'Ya lo tengo'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Ingredientes que ya tienes en casa
              </h2>
              <p className="text-xs text-slate-500">
                Estos ingredientes se han eliminado de la lista definitiva. Puedes restaurarlos cuando quieras.
              </p>
            </div>
            {removedItems.length > 0 && (
              <button
                type="button"
                onClick={onRestoreAllIngredients}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar todos
              </button>
            )}
          </div>

          {removedItems.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No has eliminado ningún ingrediente todavía. Pulsa &ldquo;Ya lo tengo&rdquo; en cualquier ingrediente de la lista para quitarlo de la compra definitiva.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {removedItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">
                        {item.name}
                      </span>
                      {item.amount > 0 && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {formatAmount(item.amount)} {item.unit}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {item.category} · {item.sources.join(' · ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestoreIngredient(item.id, item.name)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Volver a añadir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <GoogleDriveExportModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        groupedDefinitive={groupedDefinitive}
        onNotify={onNotify}
      />
    </section>
  );
}
