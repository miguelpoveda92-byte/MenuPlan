import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Sunrise,
  Sun,
  Moon,
  Sparkles,
  CalendarX2,
  ShoppingCart,
  Users,
  StickyNote,
  Scale,
  Undo2,
  AlertTriangle,
  X,
  BookOpen,
  Clock,
  ListOrdered,
} from 'lucide-react';
import {
  DAYS,
  MEAL_TYPES,
  DIET_GROUPS,
  inferDietGroup,
  formatAmount,
} from '../data/initialData';

function resolveDishRecipeDetails(dish, recipes = []) {
  const linked = recipes.find(
    (r) =>
      (dish.recipeId && r.id === dish.recipeId) ||
      r.name.trim().toLowerCase() === (dish.name || '').trim().toLowerCase(),
  );

  return {
    ...dish,
    prepTime: dish.prepTime || linked?.prepTime || null,
    description: dish.description || linked?.description || '',
    steps: dish.steps?.length > 0 ? dish.steps : linked?.steps || [],
    ingredients: dish.ingredients?.length > 0 ? dish.ingredients : linked?.ingredients || [],
    dietGroup: dish.dietGroup || linked?.dietGroup || null,
  };
}

function RecipeDetailModal({ viewingState, recipes, onClose, onEditDish }) {
  if (!viewingState) return null;
  const { dayId, mealId, dish } = viewingState;
  const details = resolveDishRecipeDetails(dish, recipes);
  const dayMeta = DAYS.find((d) => d.id === dayId);
  const mealMeta = MEAL_TYPES.find((m) => m.id === mealId);
  const dietGroupId = details.dietGroup || inferDietGroup({ ...details, mealCategory: mealId });
  const dietMeta = DIET_GROUPS.find((g) => g.id === dietGroupId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-detail-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              {dayMeta && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  {dayMeta.label}
                </span>
              )}
              {mealMeta && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${mealMeta.badgeClass}`}>
                  {mealMeta.label}
                </span>
              )}
              {dietMeta && mealId !== 'desayuno' && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${dietMeta.badgeClass}`}>
                  {dietMeta.label}
                </span>
              )}
            </div>
            <h2 id="recipe-detail-title" className="mt-2 text-lg font-extrabold text-slate-900 sm:text-xl">
              {details.name}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-emerald-600" />
                {details.servings} personas
              </span>
              {details.prepTime && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  {details.prepTime} min
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar receta"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {details.description && (
            <p className="text-sm leading-relaxed text-slate-600">{details.description}</p>
          )}

          {details.notes && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900">
              <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>{details.notes}</span>
            </div>
          )}

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Ingredientes ({details.ingredients.length})
            </h3>
            {details.ingredients.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                Este plato no tiene ingredientes registrados.
              </p>
            ) : (
              <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {details.ingredients.map((ing, idx) => (
                  <li
                    key={ing.id || idx}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{ing.name}</span>
                    {ing.amount > 0 && (
                      <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                        {formatAmount(ing.amount)} {ing.unit}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <ListOrdered className="h-4 w-4 text-emerald-600" />
              Preparación
            </h3>
            {details.steps.length === 0 ? (
              <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-xs text-slate-500">
                Esta receta aún no tiene pasos de preparación guardados. Puedes añadirlos pulsando &ldquo;Editar plato&rdquo;.
              </div>
            ) : (
              <ol className="mt-2.5 space-y-2.5">
                {details.steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm leading-relaxed text-slate-800"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEditDish(dayId, mealId, dish);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:text-sm"
          >
            <Pencil className="h-4 w-4" />
            Editar plato
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

const MEAL_ICONS = {
  desayuno: Sunrise,
  comida: Sun,
  cena: Moon,
};

function MealSlotBlock({
  dayId,
  meal,
  dishes,
  onAddDish,
  onEditDish,
  onDeleteDish,
  onViewRecipe,
  compact = false,
}) {
  const MealIcon = MEAL_ICONS[meal.id] || Sun;

  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white ${
        compact ? 'p-2.5' : 'p-3.5'
      } transition-colors`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MealIcon className={`h-3.5 w-3.5 ${meal.iconColor}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {meal.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddDish(dayId, meal.id)}
          aria-label={`Añadir plato en ${meal.label}`}
          title={`Añadir plato en ${meal.label}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-emerald-100 hover:text-emerald-700"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {dishes.length === 0 ? (
        <button
          type="button"
          onClick={() => onAddDish(dayId, meal.id)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-2.5 text-xs font-medium text-slate-400 transition hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir plato
        </button>
      ) : (
        <div className="space-y-2">
          {dishes.map((dish) => {
            const resolvedDietGroupId =
              dish.dietGroup || inferDietGroup({ ...dish, mealCategory: meal.id });
            const dietMeta = DIET_GROUPS.find((g) => g.id === resolvedDietGroupId);

            return (
              <div
                key={dish.id}
                className={`group relative rounded-lg border border-slate-200/90 border-l-4 ${meal.accentBorder} bg-slate-50/70 p-2.5 transition hover:border-slate-300 hover:bg-white hover:shadow-soft`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onViewRecipe(dayId, meal.id, dish)}
                    className="flex-1 text-left focus:outline-none"
                    title="Ver receta y preparación"
                  >
                    <p className="text-sm font-semibold leading-snug text-slate-900 group-hover:text-emerald-800">
                      {dish.name}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onEditDish(dayId, meal.id, dish)}
                      aria-label={`Editar ${dish.name}`}
                      title="Editar plato"
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDish(dayId, meal.id, dish.id)}
                      aria-label={`Eliminar ${dish.name}`}
                      title="Eliminar plato"
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 ring-1 ring-slate-200/80">
                    <Users className="h-3 w-3 text-slate-400" />
                    {dish.servings} pers.
                  </span>
                  {dietMeta && meal.id !== 'desayuno' && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${dietMeta.badgeClass}`}
                    >
                      {dietMeta.label}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onViewRecipe(dayId, meal.id, dish)}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/80 transition hover:bg-emerald-100"
                  >
                    <BookOpen className="h-3 w-3" />
                    Ver receta
                  </button>
                </div>

                {dish.notes && (
                  <p className="mt-1.5 flex items-start gap-1 text-[11px] leading-tight text-slate-500">
                    <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                    <span className="line-clamp-2">{dish.notes}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function WeeklyCalendar({
  weeklyMenu,
  recipes = [],
  plannedDishesCount,
  definitiveShoppingCount,
  dietBalance,
  hasPreviousMenu,
  previousMenuSavedAt,
  onAddDish,
  onEditDish,
  onDeleteDish,
  onClearWeek,
  onGenerateBalancedWeek,
  onRestorePreviousMenu,
  onOpenShopping,
}) {
  const [selectedMobileDay, setSelectedMobileDay] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmGenerateModal, setConfirmGenerateModal] = useState(false);
  const [viewingDishState, setViewingDishState] = useState(null);

  const visibleMobileDays =
    selectedMobileDay === 'all' ? DAYS : DAYS.filter((d) => d.id === selectedMobileDay);

  const countDayDishes = (dayId) => {
    const meals = weeklyMenu?.[dayId];
    if (!meals) return 0;
    return MEAL_TYPES.reduce((acc, m) => acc + (meals[m.id]?.length || 0), 0);
  };

  const mainDietGroups = DIET_GROUPS.filter((g) => g.id !== 'desayuno_integral');

  const handleRequestGenerate = () => {
    if (plannedDishesCount > 0) {
      setConfirmGenerateModal(true);
    } else {
      onGenerateBalancedWeek();
    }
  };

  const handleConfirmGenerate = () => {
    setConfirmGenerateModal(false);
    onGenerateBalancedWeek();
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                Calendario Semanal
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                <Users className="h-3.5 w-3.5" />
                Para 2 personas
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Menú equilibrado para 2 personas combinando legumbres, verduras, pescado y carnes blancas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRequestGenerate}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:from-emerald-700 hover:to-teal-700 sm:text-sm"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generar menú equilibrado (2 pers.)</span>
            </button>

            {hasPreviousMenu && (
              <button
                type="button"
                onClick={onRestorePreviousMenu}
                title={
                  previousMenuSavedAt
                    ? `Recuperar el menú anterior (guardado a las ${new Date(previousMenuSavedAt).toLocaleTimeString('es-ES')})`
                    : 'Recuperar el menú anterior'
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 sm:text-sm"
              >
                <Undo2 className="h-4 w-4 text-amber-700" />
                <span>Recuperar menú anterior</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenShopping}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 sm:text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Lista ({definitiveShoppingCount})</span>
            </button>

            {plannedDishesCount > 0 && (
              <>
                {confirmClear ? (
                  <div className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5">
                    <span className="text-xs font-semibold text-rose-800">¿Vaciar todo?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearWeek();
                        setConfirmClear(false);
                      }}
                      className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-700"
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    <CalendarX2 className="h-3.5 w-3.5" />
                    Vaciar
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Barra de equilibrio nutricional semanal */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Scale className="h-3.5 w-3.5 text-emerald-600" />
            Equilibrio semanal:
          </span>
          {mainDietGroups.map((grp) => {
            const count = dietBalance?.[grp.id] || 0;
            return (
              <span
                key={grp.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${grp.badgeClass}`}
              >
                <span className={`h-2 w-2 rounded-full ${grp.dotClass}`} />
                {grp.label}: {count}
                <span className="font-normal opacity-75">/{grp.targetWeekly}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Vista móvil y tablet: selector rápido + lista de tarjetas verticales */}
      <div className="space-y-4 lg:hidden">
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setSelectedMobileDay('all')}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              selectedMobileDay === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Toda la semana ({plannedDishesCount})
          </button>
          {DAYS.map((day) => {
            const count = countDayDishes(day.id);
            const isSelected = selectedMobileDay === day.id;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedMobileDay(day.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{day.shortLabel}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {visibleMobileDays.map((day) => {
            const count = countDayDishes(day.id);
            return (
              <article
                key={day.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 shadow-soft"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3">
                  <h2 className="text-base font-extrabold text-slate-900">{day.label}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                    {count} {count === 1 ? 'plato' : 'platos'}
                  </span>
                </div>
                <div className="space-y-3 p-3.5">
                  {MEAL_TYPES.map((meal) => (
                    <MealSlotBlock
                      key={meal.id}
                      dayId={day.id}
                      meal={meal}
                      dishes={weeklyMenu?.[day.id]?.[meal.id] || []}
                      onAddDish={onAddDish}
                      onEditDish={onEditDish}
                      onDeleteDish={onDeleteDish}
                      onViewRecipe={(dId, mId, dishObj) =>
                        setViewingDishState({ dayId: dId, mealId: mId, dish: dishObj })
                      }
                    />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Vista PC: cuadrícula semanal de 7 columnas */}
      <div className="hidden lg:grid lg:grid-cols-7 lg:gap-3">
        {DAYS.map((day) => {
          const count = countDayDishes(day.id);
          return (
            <div
              key={day.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100/70 shadow-soft"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3">
                <h2 className="text-sm font-extrabold tracking-tight text-slate-900">
                  {day.label}
                </h2>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {count}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-2.5">
                {MEAL_TYPES.map((meal) => (
                  <MealSlotBlock
                    key={meal.id}
                    dayId={day.id}
                    meal={meal}
                    dishes={weeklyMenu?.[day.id]?.[meal.id] || []}
                    onAddDish={onAddDish}
                    onEditDish={onEditDish}
                    onDeleteDish={onDeleteDish}
                    onViewRecipe={(dId, mId, dishObj) =>
                      setViewingDishState({ dayId: dId, mealId: mId, dish: dishObj })
                    }
                    compact
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {confirmGenerateModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-generate-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="confirm-generate-title" className="text-base font-extrabold text-slate-900">
                    ¿Sobrescribir el menú actual?
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Al generar un nuevo menú equilibrado se sustituirán los <strong>{plannedDishesCount} platos</strong> actuales de la semana. Guardaremos una copia del menú actual para que puedas recuperarlo pulsando <strong>«Recuperar menú anterior»</strong> si cambias de opinión.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmGenerateModal(false)}
                aria-label="Cerrar"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmGenerateModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmGenerate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 sm:text-sm"
              >
                <Sparkles className="h-4 w-4" />
                Sí, sobrescribir y generar
              </button>
            </div>
          </div>
        </div>
      )}
      <RecipeDetailModal
        viewingState={viewingDishState}
        recipes={recipes}
        onClose={() => setViewingDishState(null)}
        onEditDish={onEditDish}
      />
    </section>
  );
}
