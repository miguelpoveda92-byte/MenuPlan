import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Search,
  BookOpen,
  ChefHat,
  Clock,
  Users,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  DAYS,
  MEAL_TYPES,
  DIET_GROUPS,
  DEFAULT_SERVINGS,
  INGREDIENT_CATEGORIES,
  UNITS,
  generateId,
  createDishFromRecipe,
  scaleIngredients,
  inferDietGroup,
} from '../data/initialData';

export function IngredientListEditor({ ingredients, onChange, emptyHint }) {
  const handleAddRow = () => {
    onChange([
      ...ingredients,
      {
        id: generateId('ing'),
        name: '',
        amount: 1,
        unit: 'ud',
        category: INGREDIENT_CATEGORIES[0].id,
      },
    ]);
  };

  const handleUpdateRow = (id, field, value) => {
    onChange(
      ingredients.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleRemoveRow = (id) => {
    onChange(ingredients.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Ingredientes ({ingredients.length})
        </label>
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir ingrediente
        </button>
      </div>

      {ingredients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-center text-xs text-slate-500">
          {emptyHint || 'Sin ingredientes todavía. Añade ingredientes para que aparezcan en la lista de la compra.'}
        </div>
      ) : (
        <div className="space-y-2">
          {ingredients.map((ing) => (
            <div
              key={ing.id}
              className="grid grid-cols-12 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 p-2 sm:gap-2"
            >
              <input
                type="text"
                value={ing.name}
                onChange={(e) => handleUpdateRow(ing.id, 'name', e.target.value)}
                placeholder="Ej. Tomate triturado"
                className="col-span-12 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-4"
              />
              <input
                type="number"
                min="0"
                step="any"
                value={ing.amount}
                onChange={(e) => handleUpdateRow(ing.id, 'amount', e.target.value)}
                placeholder="Cant."
                aria-label="Cantidad"
                className="col-span-4 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-2"
              />
              <select
                value={ing.unit}
                onChange={(e) => handleUpdateRow(ing.id, 'unit', e.target.value)}
                aria-label="Unidad"
                className="col-span-4 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-2"
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <select
                value={ing.category}
                onChange={(e) => handleUpdateRow(ing.id, 'category', e.target.value)}
                aria-label="Categoría"
                className="col-span-10 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:col-span-3"
              >
                {INGREDIENT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRemoveRow(ing.id)}
                title="Quitar ingrediente"
                aria-label="Quitar ingrediente"
                className="col-span-2 flex h-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 sm:col-span-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DishModal({
  isOpen,
  onClose,
  dayId,
  mealId,
  dishToEdit,
  recipes,
  onSaveDish,
  onSaveAsRecipe,
}) {
  const isEditing = Boolean(dishToEdit);
  const [mode, setMode] = useState('recipes');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllMeals, setShowAllMeals] = useState(false);

  const [name, setName] = useState('');
  const [servings, setServings] = useState(DEFAULT_SERVINGS);
  const [dietGroup, setDietGroup] = useState('verduras');
  const [prepTime, setPrepTime] = useState(20);
  const [notes, setNotes] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [recipeId, setRecipeId] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [alsoSaveRecipe, setAlsoSaveRecipe] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (dishToEdit) {
      const linked = recipes.find(
        (r) =>
          (dishToEdit.recipeId && r.id === dishToEdit.recipeId) ||
          r.name.trim().toLowerCase() === (dishToEdit.name || '').trim().toLowerCase(),
      );
      setMode('custom');
      setName(dishToEdit.name || '');
      setServings(dishToEdit.servings || DEFAULT_SERVINGS);
      setDietGroup(
        dishToEdit.dietGroup || inferDietGroup({ ...dishToEdit, mealCategory: mealId }),
      );
      setPrepTime(dishToEdit.prepTime || linked?.prepTime || 20);
      setNotes(dishToEdit.notes || '');
      const existingSteps = dishToEdit.steps?.length ? dishToEdit.steps : linked?.steps || [];
      setStepsText(existingSteps.join('\n'));
      setRecipeId(dishToEdit.recipeId || null);
      setIngredients((dishToEdit.ingredients || []).map((ing) => ({ ...ing })));
      setAlsoSaveRecipe(false);
    } else {
      setMode(recipes.length > 0 ? 'recipes' : 'custom');
      setSearchTerm('');
      setShowAllMeals(false);
      setName('');
      setServings(DEFAULT_SERVINGS);
      setDietGroup(mealId === 'desayuno' ? 'desayuno_integral' : 'verduras');
      setPrepTime(20);
      setNotes('');
      setStepsText('');
      setRecipeId(null);
      setIngredients([]);
      setAlsoSaveRecipe(false);
    }
  }, [isOpen, dishToEdit, recipes, mealId]);

  const dayMeta = DAYS.find((d) => d.id === dayId);
  const mealMeta = MEAL_TYPES.find((m) => m.id === mealId);

  const filteredRecipes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return recipes.filter((rec) => {
      const matchesMeal = showAllMeals || !mealId || rec.mealCategory === mealId;
      const matchesQuery =
        !query ||
        rec.name.toLowerCase().includes(query) ||
        rec.ingredients.some((i) => i.name.toLowerCase().includes(query));
      return matchesMeal && matchesQuery;
    });
  }, [recipes, searchTerm, showAllMeals, mealId]);

  if (!isOpen) return null;

  const handleQuickAddRecipe = (recipe) => {
    const newDish = createDishFromRecipe(recipe, DEFAULT_SERVINGS);
    onSaveDish(dayId, mealId, newDish, false);
    onClose();
  };

  const handleLoadRecipeIntoEditor = (recipe) => {
    setMode('custom');
    setName(recipe.name);
    setServings(DEFAULT_SERVINGS);
    setDietGroup(recipe.dietGroup || inferDietGroup(recipe));
    setPrepTime(recipe.prepTime || 20);
    setNotes('');
    setStepsText((recipe.steps || []).join('\n'));
    setRecipeId(recipe.id);
    setIngredients(
      scaleIngredients(recipe.ingredients, recipe.servings || DEFAULT_SERVINGS, DEFAULT_SERVINGS),
    );
  };

  const handleServingsChange = (nextVal) => {
    const parsed = Math.max(1, Number(nextVal) || 1);
    if (ingredients.length > 0 && servings > 0 && parsed !== servings) {
      setIngredients((prev) => scaleIngredients(prev, servings, parsed));
    }
    setServings(parsed);
  };

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
      .map((s) => s.trim())
      .filter(Boolean);

    const dishPayload = {
      id: dishToEdit ? dishToEdit.id : generateId('dish'),
      recipeId,
      name: cleanName,
      servings: Math.max(1, Number(servings) || DEFAULT_SERVINGS),
      dietGroup,
      prepTime: Math.max(1, Number(prepTime) || 20),
      description: dishToEdit?.description || '',
      steps: cleanSteps,
      notes: notes.trim(),
      ingredients: cleanIngredients,
    };

    if (alsoSaveRecipe && !recipeId && onSaveAsRecipe) {
      const createdRecipe = onSaveAsRecipe({
        name: cleanName,
        mealCategory: mealId || 'comida',
        dietGroup,
        prepTime: dishPayload.prepTime,
        servings: dishPayload.servings,
        description: notes.trim() || 'Receta guardada desde el calendario semanal.',
        steps: cleanSteps,
        ingredients: cleanIngredients,
      });
      if (createdRecipe) {
        dishPayload.recipeId = createdRecipe.id;
      }
    }

    onSaveDish(dayId, mealId, dishPayload, isEditing);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              {mealMeta && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${mealMeta.badgeClass}`}>
                  {mealMeta.label}
                </span>
              )}
              {dayMeta && (
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {dayMeta.label}
                </span>
              )}
            </div>
            <h2 id="dish-modal-title" className="mt-1 text-lg font-bold text-slate-900">
              {isEditing ? 'Editar plato planificado' : 'Añadir plato al menú'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isEditing && (
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-2.5">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-200/70 p-1">
              <button
                type="button"
                onClick={() => setMode('recipes')}
                className={`flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-bold transition sm:text-sm ${
                  mode === 'recipes'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Elegir de recetas
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-bold transition sm:text-sm ${
                  mode === 'custom'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ChefHat className="h-4 w-4" />
                Plato personalizado
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {mode === 'recipes' && !isEditing ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar receta o ingrediente..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={showAllMeals}
                    onChange={(e) => setShowAllMeals(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Ver todas las categorías
                </label>
              </div>

              {filteredRecipes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No hay recetas que coincidan con tu búsqueda.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Prueba activando &ldquo;Ver todas las categorías&rdquo; o crea un plato personalizado.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('custom')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                    Crear plato personalizado
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {filteredRecipes.map((recipe) => {
                    const cat = MEAL_TYPES.find((m) => m.id === recipe.mealCategory);
                    return (
                      <div
                        key={recipe.id}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-emerald-300 hover:shadow-soft"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{recipe.name}</h3>
                            {cat && (
                              <span
                                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cat.badgeClass}`}
                              >
                                {cat.label}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {recipe.prepTime} min
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {recipe.servings} rac.
                            </span>
                            <span>{recipe.ingredients.length} ingred.</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleQuickAddRecipe(recipe)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Añadir directo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadRecipeIntoEditor(recipe)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            Ajustar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form id="dish-editor-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Nombre del plato *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Ensalada César con pollo a la plancha"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Grupo nutricional
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
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Personas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={servings}
                    onChange={(e) => handleServingsChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Notas opcionales
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Preparar el día anterior, sin lactosa..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <IngredientListEditor
                ingredients={ingredients}
                onChange={setIngredients}
                emptyHint="Añade ingredientes a este plato si quieres que se sumen automáticamente en tu lista de la compra."
              />

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Pasos de preparación (opcional, uno por línea)
                </label>
                <textarea
                  rows="3"
                  value={stepsText}
                  onChange={(e) => setStepsText(e.target.value)}
                  placeholder={'1. Cortar y saltear las verduras.\n2. Cocinar a fuego medio 15 minutos.'}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {!isEditing && !recipeId && (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3.5 py-2.5 text-xs font-semibold text-emerald-900">
                  <input
                    type="checkbox"
                    checked={alsoSaveRecipe}
                    onChange={(e) => setAlsoSaveRecipe(e.target.checked)}
                    className="h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                  />
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Guardar también este plato en mi Recetario para reutilizarlo más adelante
                </label>
              )}
            </form>
          )}
        </div>

        {(mode === 'custom' || isEditing) && (
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
              form="dish-editor-form"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Check className="h-4 w-4" />
              {isEditing ? 'Guardar cambios' : 'Añadir al menú'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
