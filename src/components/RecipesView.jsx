import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Clock,
  Users,
  Pencil,
  Trash2,
  CalendarPlus,
  X,
  Check,
  BookOpen,
  ListOrdered,
  Globe,
  FileUp,
  Download,
  Loader2,
  Sparkles,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  DAYS,
  MEAL_TYPES,
  DIET_GROUPS,
  DEFAULT_SERVINGS,
  generateId,
  formatAmount,
  createDishFromRecipe,
  inferDietGroup,
} from '../data/initialData';
import {
  searchInternetRecipes,
  extractRecipesFromPdfFiles,
  parseMultipleRecipesFromText,
  generateSampleRecipePdfBlob,
} from '../utils/recipeServices';
import { IngredientListEditor } from './DishModal';

function RecipeFormModal({ isOpen, onClose, recipeToEdit, onSave }) {
  const isEditing = Boolean(recipeToEdit);
  const [name, setName] = useState(recipeToEdit?.name || '');
  const [mealCategory, setMealCategory] = useState(recipeToEdit?.mealCategory || 'comida');
  const [dietGroup, setDietGroup] = useState(
    recipeToEdit?.dietGroup || (recipeToEdit ? inferDietGroup(recipeToEdit) : 'verduras'),
  );
  const [prepTime, setPrepTime] = useState(recipeToEdit?.prepTime || 20);
  const [servings, setServings] = useState(recipeToEdit?.servings || DEFAULT_SERVINGS);
  const [description, setDescription] = useState(recipeToEdit?.description || '');
  const [ingredients, setIngredients] = useState(
    recipeToEdit?.ingredients ? recipeToEdit.ingredients.map((i) => ({ ...i })) : [],
  );
  const [stepsText, setStepsText] = useState((recipeToEdit?.steps || []).join('\n'));

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const cleanIngredients = ingredients
      .filter((ing) => ing.name.trim())
      .map((ing) => ({
        ...ing,
        name: ing.name.trim(),
        amount: Math.max(0, Number(ing.amount) || 0),
      }));

    const cleanSteps = stepsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    onSave(
      {
        id: recipeToEdit ? recipeToEdit.id : generateId('rec'),
        name: cleanName,
        mealCategory,
        dietGroup,
        prepTime: Math.max(1, Number(prepTime) || 15),
        servings: Math.max(1, Number(servings) || DEFAULT_SERVINGS),
        description: description.trim(),
        ingredients: cleanIngredients,
        steps: cleanSteps,
      },
      isEditing,
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="recipe-modal-title" className="text-lg font-bold text-slate-900">
            {isEditing ? 'Editar receta' : 'Nueva receta'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="recipe-form" onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-6">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Nombre de la receta *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Gazpacho andaluz casero"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Comida
              </label>
              <select
                value={mealCategory}
                onChange={(e) => setMealCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {MEAL_TYPES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Grupo dieta
              </label>
              <select
                value={dietGroup}
                onChange={(e) => setDietGroup(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {DIET_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-8">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Descripción breve
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Receta fresca de verano con hortalizas de temporada."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Minutos
              </label>
              <input
                type="number"
                min="1"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Personas
              </label>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <IngredientListEditor
            ingredients={ingredients}
            onChange={setIngredients}
            emptyHint="Añade los ingredientes con su cantidad para 2 personas y su categoría."
          />

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Pasos de preparación (uno por línea)
            </label>
            <textarea
              rows="3"
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              placeholder={'1. Lavar y trocear las verduras.\n2. Triturar con aceite de oliva y vinagre.'}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="recipe-form"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Check className="h-4 w-4" />
            {isEditing ? 'Guardar receta' : 'Crear receta'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InternetSearchModal({ isOpen, onClose, existingRecipes, onAddRecipe }) {
  const [query, setQuery] = useState('');
  const [dietFilter, setDietFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [apiReachable, setApiReachable] = useState(true);
  const [addedIds, setAddedIds] = useState(() => new Set());

  const runSearch = async (searchQuery, groupFilter) => {
    setLoading(true);
    try {
      const response = await searchInternetRecipes(searchQuery, groupFilter);
      setResults(response.results);
      setApiReachable(response.apiReachable);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    runSearch('', 'all');
  }, [isOpen]);

  if (!isOpen) return null;

  const existingNames = new Set(existingRecipes.map((r) => r.name.trim().toLowerCase()));

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    runSearch(query, dietFilter);
  };

  const handleFilterClick = (nextGroup) => {
    setDietFilter(nextGroup);
    runSearch(query, nextGroup);
  };

  const handleImportOnline = (recipe) => {
    const newRecipe = {
      ...recipe,
      id: generateId('rec_web'),
      servings: DEFAULT_SERVINGS,
    };
    onAddRecipe(newRecipe);
    setAddedIds((prev) => new Set([...prev, recipe.id]));
  };

  const mainGroups = DIET_GROUPS.filter((g) => g.id !== 'desayuno_integral');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="internet-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-sky-600" />
              <h2 id="internet-modal-title" className="text-lg font-bold text-slate-900">
                Buscar recetas en Internet
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Todas las recetas encontradas se ajustan automáticamente para 2 personas antes de añadirse a tu lista.
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

        <div className="space-y-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej. pollo, salmón, lentejas, garbanzos, verduras..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700 disabled:opacity-60 sm:text-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </button>
          </form>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => handleFilterClick('all')}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                dietFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos los grupos
            </button>
            {mainGroups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => handleFilterClick(g.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                  dietFilter === g.id
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {!apiReachable && (
            <p className="text-[11px] font-medium text-amber-700">
              Mostrando resultados del catálogo mediterráneo online (sin conexión con TheMealDB en este momento).
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
              <p className="mt-2 text-sm font-medium">Buscando recetas en Internet...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No se encontraron recetas para esa búsqueda.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Prueba con términos como &ldquo;pollo&rdquo;, &ldquo;salmón&rdquo;, &ldquo;lentejas&rdquo; o &ldquo;verduras&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {results.map((rec) => {
                const isAdded =
                  addedIds.has(rec.id) || existingNames.has(rec.name.trim().toLowerCase());
                const dietMeta = DIET_GROUPS.find((g) => g.id === rec.dietGroup);

                return (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-soft"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {dietMeta && (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${dietMeta.badgeClass}`}
                            >
                              {dietMeta.label}
                            </span>
                          )}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {rec.sourceLabel || 'Internet'}
                          </span>
                        </div>
                        {rec.sourceUrl && (
                          <a
                            href={rec.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Ver receta original"
                            className="text-slate-400 hover:text-sky-600"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>

                      <div className="mt-2.5 flex gap-3">
                        {rec.imageUrl && (
                          <img
                            src={rec.imageUrl}
                            alt={rec.name}
                            className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold leading-snug text-slate-900">
                            {rec.name}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {rec.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {rec.ingredients.slice(0, 4).map((ing) => (
                          <span
                            key={ing.id}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700"
                          >
                            {ing.name} ({formatAmount(ing.amount)} {ing.unit})
                          </span>
                        ))}
                        {rec.ingredients.length > 4 && (
                          <span className="text-[11px] font-semibold text-slate-400">
                            +{rec.ingredients.length - 4} más
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleImportOnline(rec)}
                      className={`mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                        isAdded
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-4 w-4" />
                          Añadida a tu recetario (2 pers.)
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Añadir a mis recetas (2 pers.)
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PdfImportModal({ isOpen, onClose, onSaveRecipesBatch }) {
  const [parsing, setParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsgs, setErrorMsgs] = useState([]);
  const [loadedFiles, setLoadedFiles] = useState([]);
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState('');
  const [expandedDraftId, setExpandedDraftId] = useState(null);

  const [draftItems, setDraftItems] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setParsing(false);
      setIsDragging(false);
      setErrorMsgs([]);
      setLoadedFiles([]);
      setManualMode(false);
      setManualText('');
      setExpandedDraftId(null);
      setDraftItems([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const appendParsedResults = (parsedEntries = []) => {
    const formatted = parsedEntries.map((entry) => ({
      draftId: generateId('pdf_draft'),
      selected: true,
      sourceFile: entry.sourceFile || 'Receta PDF',
      originalServings: entry.originalServings,
      ...entry.recipe,
      stepsText: (entry.recipe.steps || []).join('\n'),
    }));

    setDraftItems((prev) => {
      const merged = [...prev, ...formatted];
      if (formatted.length === 1 && prev.length === 0) {
        setExpandedDraftId(formatted[0].draftId);
      }
      return merged;
    });
  };

  const processFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(
      (f) => f && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')),
    );
    if (files.length === 0) {
      setErrorMsgs(['Selecciona o suelta al menos un archivo con extensión .pdf.']);
      return;
    }

    setErrorMsgs([]);
    setLoadedFiles((prev) => Array.from(new Set([...prev, ...files.map((f) => f.name)])));
    setParsing(true);
    try {
      const { items, errors } = await extractRecipesFromPdfFiles(files);
      if (items.length > 0) {
        appendParsedResults(items);
      }
      if (errors.length > 0) {
        setErrorMsgs(errors.map((e) => `${e.fileName}: ${e.message}`));
      }
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleParseManualText = () => {
    if (!manualText.trim()) return;
    setErrorMsgs([]);
    const parsedList = parseMultipleRecipesFromText(manualText, 'Texto pegado');
    if (parsedList.length === 0) {
      setErrorMsgs(['No se pudo detectar ninguna receta en el texto pegado.']);
      return;
    }
    appendParsedResults(parsedList);
    setManualText('');
    setManualMode(false);
  };

  const handleDownloadSamplePdf = () => {
    const blob = generateSampleRecipePdfBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recetas_ejemplo_lote.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const updateDraftItem = (draftId, patch) => {
    setDraftItems((prev) =>
      prev.map((item) => (item.draftId === draftId ? { ...item, ...patch } : item)),
    );
  };

  const removeDraftItem = (draftId) => {
    setDraftItems((prev) => prev.filter((item) => item.draftId !== draftId));
    if (expandedDraftId === draftId) setExpandedDraftId(null);
  };

  const selectedCount = draftItems.filter((d) => d.selected && d.name.trim()).length;

  const handleToggleAll = (nextSelected) => {
    setDraftItems((prev) => prev.map((item) => ({ ...item, selected: nextSelected })));
  };

  const handleSaveBatch = (e) => {
    e.preventDefault();
    const toSave = draftItems
      .filter((d) => d.selected && d.name.trim())
      .map((draft) => ({
        id: generateId('rec_pdf'),
        name: draft.name.trim(),
        mealCategory: draft.mealCategory,
        dietGroup: draft.dietGroup,
        prepTime: Math.max(1, Number(draft.prepTime) || 25),
        servings: Math.max(1, Number(draft.servings) || DEFAULT_SERVINGS),
        description: (draft.description || '').trim(),
        ingredients: (draft.ingredients || []).filter((i) => i.name.trim()),
        steps: (draft.stepsText || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      }));

    if (toSave.length === 0) return;
    onSaveRecipesBatch(toSave);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-violet-600" />
              <h2 id="pdf-modal-title" className="text-lg font-bold text-slate-900">
                Importar Recetas desde PDF (Lote)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Selecciona o arrastra varios archivos PDF a la vez (o un PDF con varias recetas dentro). Todas se escalan a 2 personas.
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

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${
              isDragging
                ? 'border-violet-500 bg-violet-100/70'
                : 'border-violet-200 bg-violet-50/50'
            }`}
          >
            <FileText className="mx-auto h-9 w-9 text-violet-500" />
            <p className="mt-2 text-sm font-bold text-slate-800">
              {loadedFiles.length > 0
                ? `${loadedFiles.length} ${loadedFiles.length === 1 ? 'archivo PDF procesado' : 'archivos PDF procesados'}: ${loadedFiles.join(', ')}`
                : 'Arrastra varios PDF aquí o selecciónalos de una vez'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Detecta múltiples recetas por archivo, ingredientes, unidades, raciones y pasos de preparación.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700">
                {parsing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="h-4 w-4" />
                )}
                {parsing
                  ? 'Leyendo PDFs...'
                  : draftItems.length > 0
                    ? 'Añadir más PDFs'
                    : 'Seleccionar uno o varios PDF'}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleDownloadSamplePdf}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3.5 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
              >
                <Download className="h-4 w-4" />
                PDF de ejemplo (3 recetas)
              </button>

              <button
                type="button"
                onClick={() => setManualMode((prev) => !prev)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {manualMode ? 'Ocultar texto' : 'Pegar texto (1 o varias)'}
              </button>
            </div>
          </div>

          {errorMsgs.length > 0 && (
            <div className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
              {errorMsgs.map((msg, i) => (
                <p key={i}>{msg}</p>
              ))}
            </div>
          )}

          {manualMode && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <label className="block text-xs font-bold text-slate-700">
                Pega el texto de una o varias recetas (separadas con <code>Título:</code> o <code>---</code>):
              </label>
              <textarea
                rows="5"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={'Título: Pollo al horno\nPara 4 personas\nIngredientes:\n- 600 g de pollo\n---\nTítulo: Lentejas rápidas\nPara 2 personas\nIngredientes:\n- 200 g de lentejas'}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleParseManualText}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Detectar y añadir al lote (2 pers.)
              </button>
            </div>
          )}

          {draftItems.length > 0 && (
            <form id="pdf-batch-form" onSubmit={handleSaveBatch} className="space-y-3 border-t border-slate-200 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">
                    Recetas detectadas ({draftItems.length})
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                    {selectedCount} seleccionadas
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleToggleAll(true)}
                    className="text-emerald-700 hover:underline"
                  >
                    Marcar todas
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAll(false)}
                    className="text-slate-500 hover:underline"
                  >
                    Desmarcar
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftItems([]);
                      setLoadedFiles([]);
                    }}
                    className="text-rose-600 hover:underline"
                  >
                    Limpiar lista
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {draftItems.map((draft) => {
                  const isExpanded = expandedDraftId === draft.draftId;
                  const dietMeta = DIET_GROUPS.find((g) => g.id === draft.dietGroup);
                  return (
                    <div
                      key={draft.draftId}
                      className={`rounded-xl border transition ${
                        draft.selected
                          ? 'border-emerald-200 bg-white shadow-soft'
                          : 'border-slate-200 bg-slate-50/70 opacity-75'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3.5">
                        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={draft.selected}
                            onChange={(e) =>
                              updateDraftItem(draft.draftId, { selected: e.target.checked })
                            }
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {draft.name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                                {draft.sourceFile}
                              </span>
                              {dietMeta && (
                                <span
                                  className={`rounded-full border px-2 py-0.5 font-bold ${dietMeta.badgeClass}`}
                                >
                                  {dietMeta.label}
                                </span>
                              )}
                              <span className="font-semibold text-slate-500">
                                {(draft.ingredients || []).length} ingred.
                              </span>
                              {draft.originalServings !== DEFAULT_SERVINGS && (
                                <span className="font-semibold text-emerald-700">
                                  ({draft.originalServings} → 2 pers.)
                                </span>
                              )}
                            </div>
                          </div>
                        </label>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDraftId(isExpanded ? null : draft.draftId)
                            }
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            {isExpanded ? 'Cerrar edición' : 'Editar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeDraftItem(draft.draftId)}
                            aria-label={`Quitar ${draft.name}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-3.5">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                            <div className="sm:col-span-6">
                              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                Nombre *
                              </label>
                              <input
                                type="text"
                                required
                                value={draft.name}
                                onChange={(e) =>
                                  updateDraftItem(draft.draftId, { name: e.target.value })
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                Comida
                              </label>
                              <select
                                value={draft.mealCategory}
                                onChange={(e) =>
                                  updateDraftItem(draft.draftId, { mealCategory: e.target.value })
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-800"
                              >
                                {MEAL_TYPES.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-3">
                              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                Grupo dieta
                              </label>
                              <select
                                value={draft.dietGroup}
                                onChange={(e) =>
                                  updateDraftItem(draft.draftId, { dietGroup: e.target.value })
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-800"
                              >
                                {DIET_GROUPS.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <IngredientListEditor
                            ingredients={draft.ingredients || []}
                            onChange={(nextIngs) =>
                              updateDraftItem(draft.draftId, { ingredients: nextIngs })
                            }
                            emptyHint="No se detectaron líneas de ingredientes con formato estándar; puedes añadirlos aquí."
                          />

                          <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                              Pasos detectados
                            </label>
                            <textarea
                              rows="3"
                              value={draft.stepsText}
                              onChange={(e) =>
                                updateDraftItem(draft.draftId, { stepsText: e.target.value })
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </form>
          )}
        </div>

        {draftItems.length > 0 && (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="pdf-batch-form"
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {selectedCount === 1
                ? 'Guardar 1 receta (2 pers.)'
                : `Guardar ${selectedCount} recetas (2 pers.)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecipesView({
  recipes,
  onAddRecipe,
  onAddRecipesBatch,
  onUpdateRecipe,
  onDeleteRecipe,
  onAssignRecipeToMenu,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dietFilter, setDietFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [internetModalOpen, setInternetModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);

  const [assigningRecipe, setAssigningRecipe] = useState(null);
  const [assignDay, setAssignDay] = useState('lunes');
  const [assignMeal, setAssignMeal] = useState('comida');
  const [assignServings, setAssignServings] = useState(DEFAULT_SERVINGS);

  const filteredRecipes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return recipes.filter((rec) => {
      const resolvedDiet = rec.dietGroup || inferDietGroup(rec);
      const matchesCat = categoryFilter === 'all' || rec.mealCategory === categoryFilter;
      const matchesDiet = dietFilter === 'all' || resolvedDiet === dietFilter;
      const matchesSearch =
        !query ||
        rec.name.toLowerCase().includes(query) ||
        (rec.description || '').toLowerCase().includes(query) ||
        rec.ingredients.some((i) => i.name.toLowerCase().includes(query));
      return matchesCat && matchesDiet && matchesSearch;
    });
  }, [recipes, searchTerm, categoryFilter, dietFilter]);

  const handleOpenCreate = () => {
    setEditingRecipe(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (recipe) => {
    setEditingRecipe(recipe);
    setModalOpen(true);
  };

  const handleSaveModal = (recipeData, isEditing) => {
    if (isEditing) {
      onUpdateRecipe(recipeData);
    } else {
      onAddRecipe(recipeData);
    }
  };

  const handleOpenAssign = (recipe) => {
    setAssigningRecipe(recipe);
    setAssignMeal(recipe.mealCategory || 'comida');
    setAssignServings(DEFAULT_SERVINGS);
  };

  const handleConfirmAssign = (e) => {
    e.preventDefault();
    if (!assigningRecipe) return;
    const dish = createDishFromRecipe(assigningRecipe, assignServings);
    onAssignRecipeToMenu(assignDay, assignMeal, dish);
    setAssigningRecipe(null);
  };

  const mainDietFilters = DIET_GROUPS.filter((g) => g.id !== 'desayuno_integral');

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Recetario Personal (2 personas)
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Añade recetas manualmente, búscalas en Internet o convierte archivos PDF al formato de tu menú.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setInternetModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs font-bold text-sky-800 transition hover:bg-sky-100 sm:text-sm"
          >
            <Globe className="h-4 w-4 text-sky-600" />
            Buscar en Internet
          </button>

          <button
            type="button"
            onClick={() => setPdfModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-xs font-bold text-violet-800 transition hover:bg-violet-100 sm:text-sm"
          >
            <FileUp className="h-4 w-4 text-violet-600" />
            Importar PDF
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            Nueva receta
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar receta o ingrediente..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-soft focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todas ({recipes.length})
            </button>
            {MEAL_TYPES.map((meal) => {
              const count = recipes.filter((r) => r.mealCategory === meal.id).length;
              const active = categoryFilter === meal.id;
              return (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => setCategoryFilter(meal.id)}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {meal.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Dieta:
          </span>
          <button
            type="button"
            onClick={() => setDietFilter('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
              dietFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Cualquier grupo
          </button>
          {mainDietFilters.map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => setDietFilter(grp.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                dietFilter === grp.id
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  dietFilter === grp.id ? 'bg-white' : grp.dotClass
                }`}
              />
              {grp.label}
            </button>
          ))}
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-base font-bold text-slate-800">
            No se encontraron recetas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Prueba cambiando los filtros, busca nuevas recetas en Internet o importa un PDF.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setInternetModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-700"
            >
              <Globe className="h-4 w-4" />
              Buscar en Internet
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Añadir receta
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRecipes.map((recipe) => {
            const cat = MEAL_TYPES.find((m) => m.id === recipe.mealCategory);
            const dietMeta = DIET_GROUPS.find(
              (g) => g.id === (recipe.dietGroup || inferDietGroup(recipe)),
            );
            const isExpanded = expandedRecipeId === recipe.id;

            return (
              <article
                key={recipe.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-soft transition hover:border-slate-300 hover:shadow-card"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {cat && (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${cat.badgeClass}`}
                        >
                          {cat.label}
                        </span>
                      )}
                      {dietMeta && recipe.mealCategory !== 'desayuno' && (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${dietMeta.badgeClass}`}
                        >
                          {dietMeta.label}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {recipe.prepTime} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {recipe.servings}
                      </span>
                    </div>
                  </div>

                  <h2 className="mt-3 text-lg font-bold leading-snug text-slate-900">
                    {recipe.name}
                  </h2>

                  {recipe.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {recipe.description}
                    </p>
                  )}

                  <div className="mt-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Ingredientes ({recipe.ingredients.length})
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(isExpanded ? recipe.ingredients : recipe.ingredients.slice(0, 4)).map(
                        (ing) => (
                          <span
                            key={ing.id}
                            className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                          >
                            {ing.name}{' '}
                            {ing.amount > 0 && (
                              <span className="text-slate-500">
                                ({formatAmount(ing.amount)} {ing.unit})
                              </span>
                            )}
                          </span>
                        ),
                      )}
                      {!isExpanded && recipe.ingredients.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setExpandedRecipeId(recipe.id)}
                          className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                        >
                          +{recipe.ingredients.length - 4} más
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && recipe.steps?.length > 0 && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                        <ListOrdered className="h-3.5 w-3.5 text-emerald-600" />
                        Preparación
                      </p>
                      <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
                        {recipe.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                  <button
                    type="button"
                    onClick={() => handleOpenAssign(recipe)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Añadir al menú
                  </button>

                  <div className="flex items-center gap-1">
                    {(recipe.steps?.length > 0 || recipe.ingredients.length > 4) && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRecipeId(isExpanded ? null : recipe.id)
                        }
                        className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        {isExpanded ? 'Ocultar' : 'Ver detalle'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(recipe)}
                      title="Editar receta"
                      aria-label={`Editar ${recipe.name}`}
                      className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-emerald-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecipe(recipe.id)}
                      title="Eliminar receta"
                      aria-label={`Eliminar ${recipe.name}`}
                      className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <RecipeFormModal
          key={editingRecipe ? editingRecipe.id : 'new-recipe'}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          recipeToEdit={editingRecipe}
          onSave={handleSaveModal}
        />
      )}

      <InternetSearchModal
        isOpen={internetModalOpen}
        onClose={() => setInternetModalOpen(false)}
        existingRecipes={recipes}
        onAddRecipe={onAddRecipe}
      />

      <PdfImportModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        onSaveRecipesBatch={onAddRecipesBatch || ((list) => list.forEach(onAddRecipe))}
      />

      {assigningRecipe && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleConfirmAssign}
            className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Planificar en calendario
                </span>
                <h3 className="mt-0.5 text-lg font-bold text-slate-900">
                  {assigningRecipe.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningRecipe(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Día de la semana
                </label>
                <select
                  value={assignDay}
                  onChange={(e) => setAssignDay(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Comida
                  </label>
                  <select
                    value={assignMeal}
                    onChange={(e) => setAssignMeal(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    {MEAL_TYPES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Personas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={assignServings}
                    onChange={(e) => setAssignServings(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningRecipe(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                <Check className="h-4 w-4" />
                Añadir al menú
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
