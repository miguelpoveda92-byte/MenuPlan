import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  DEFAULT_SERVINGS,
  DAYS,
  MEAL_TYPES,
  INITIAL_RECIPES,
  createEmptyMenu,
  generateBalancedWeeklyMenu,
  calculateDietBalance,
  buildShoppingList,
  generateId,
  inferDietGroup,
} from './data/initialData';
import Navbar from './components/Navbar';
import WeeklyCalendar from './components/WeeklyCalendar';
import DishModal from './components/DishModal';
import RecipesView from './components/RecipesView';
import ShoppingListView from './components/ShoppingListView';

const DEFAULT_SHOPPING_STATE = {
  alreadyHaveIds: [],
  checkedIds: [],
  extraItems: [],
};

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [recipes, setRecipes] = useLocalStorage(STORAGE_KEYS.RECIPES, INITIAL_RECIPES);
  const [weeklyMenu, setWeeklyMenu] = useLocalStorage(STORAGE_KEYS.WEEKLY_MENU, () =>
    generateBalancedWeeklyMenu(INITIAL_RECIPES, DEFAULT_SERVINGS),
  );
  const [shoppingState, setShoppingState] = useLocalStorage(
    STORAGE_KEYS.SHOPPING_STATE,
    DEFAULT_SHOPPING_STATE,
  );

  // Asegurar compatibilidad con datos previos en localStorage (añadir nuevas recetas base y grupos dietéticos)
  useEffect(() => {
    setRecipes((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return INITIAL_RECIPES;
      const existingIds = new Set(prev.map((r) => r.id));
      let changed = false;
      const upgraded = prev.map((r) => {
        if (!r.dietGroup) {
          changed = true;
          return { ...r, dietGroup: inferDietGroup(r) };
        }
        return r;
      });
      const missingDefaults = INITIAL_RECIPES.filter((r) => !existingIds.has(r.id));
      if (missingDefaults.length > 0) {
        changed = true;
        upgraded.push(...missingDefaults);
      }
      return changed ? upgraded : prev;
    });
  }, [setRecipes]);

  const [dishModalState, setDishModalState] = useState({
    isOpen: false,
    dayId: 'lunes',
    mealId: 'comida',
    dishToEdit: null,
  });

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast({ id: Date.now(), message });
    setTimeout(() => {
      setToast((current) => (current && Date.now() - current.id >= 2600 ? null : current));
    }, 2800);
  }, []);

  const plannedDishesCount = useMemo(() => {
    let count = 0;
    for (const day of DAYS) {
      for (const meal of MEAL_TYPES) {
        count += weeklyMenu?.[day.id]?.[meal.id]?.length || 0;
      }
    }
    return count;
  }, [weeklyMenu]);

  const dietBalance = useMemo(() => calculateDietBalance(weeklyMenu), [weeklyMenu]);

  const shoppingItems = useMemo(
    () => buildShoppingList(weeklyMenu, shoppingState?.extraItems || []),
    [weeklyMenu, shoppingState?.extraItems],
  );

  const definitiveShoppingCount = useMemo(() => {
    const alreadyHave = new Set(shoppingState?.alreadyHaveIds || []);
    return shoppingItems.filter((item) => !alreadyHave.has(item.id)).length;
  }, [shoppingItems, shoppingState?.alreadyHaveIds]);

  const handleOpenAddDish = (dayId, mealId) => {
    setDishModalState({
      isOpen: true,
      dayId,
      mealId,
      dishToEdit: null,
    });
  };

  const handleOpenEditDish = (dayId, mealId, dish) => {
    setDishModalState({
      isOpen: true,
      dayId,
      mealId,
      dishToEdit: dish,
    });
  };

  const handleSaveDish = (dayId, mealId, dishPayload, isEditing) => {
    setWeeklyMenu((prev) => {
      const safeDay = prev[dayId] || { desayuno: [], comida: [], cena: [] };
      const currentList = safeDay[mealId] || [];
      const nextList = isEditing
        ? currentList.map((d) => (d.id === dishPayload.id ? dishPayload : d))
        : [...currentList, dishPayload];

      return {
        ...prev,
        [dayId]: {
          ...safeDay,
          [mealId]: nextList,
        },
      };
    });
    showToast(isEditing ? `Plato "${dishPayload.name}" actualizado` : `"${dishPayload.name}" añadido al menú`);
  };

  const handleDeleteDish = (dayId, mealId, dishId) => {
    setWeeklyMenu((prev) => {
      const safeDay = prev[dayId] || { desayuno: [], comida: [], cena: [] };
      return {
        ...prev,
        [dayId]: {
          ...safeDay,
          [mealId]: (safeDay[mealId] || []).filter((d) => d.id !== dishId),
        },
      };
    });
    showToast('Plato eliminado del calendario');
  };

  const handleClearWeek = () => {
    setWeeklyMenu(createEmptyMenu());
    showToast('Calendario semanal vaciado');
  };

  const handleGenerateBalancedWeek = () => {
    const sourceRecipes = recipes.length > 0 ? recipes : INITIAL_RECIPES;
    if (recipes.length === 0) {
      setRecipes(INITIAL_RECIPES);
    }
    setWeeklyMenu(generateBalancedWeeklyMenu(sourceRecipes, DEFAULT_SERVINGS));
    showToast('Menú semanal equilibrado generado para 2 personas');
  };

  const handleAddRecipe = (recipeData) => {
    const created = { ...recipeData, id: recipeData.id || generateId('rec') };
    setRecipes((prev) => [created, ...prev]);
    showToast(`Receta "${created.name}" guardada`);
    return created;
  };

  const handleUpdateRecipe = (updatedRecipe) => {
    setRecipes((prev) => prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)));
    showToast(`Receta "${updatedRecipe.name}" actualizada`);
  };

  const handleDeleteRecipe = (recipeId) => {
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    showToast('Receta eliminada del recetario');
  };

  const handleAssignRecipeToMenu = (dayId, mealId, dish) => {
    handleSaveDish(dayId, mealId, dish, false);
  };

  const handleMarkAlreadyHave = (ingredientId, name) => {
    setShoppingState((prev) => ({
      ...prev,
      alreadyHaveIds: Array.from(new Set([...(prev.alreadyHaveIds || []), ingredientId])),
      checkedIds: (prev.checkedIds || []).filter((id) => id !== ingredientId),
    }));
    showToast(`"${name}" eliminado de la lista definitiva`);
  };

  const handleRestoreIngredient = (ingredientId, name) => {
    setShoppingState((prev) => ({
      ...prev,
      alreadyHaveIds: (prev.alreadyHaveIds || []).filter((id) => id !== ingredientId),
    }));
    showToast(`"${name}" restaurado en la lista de la compra`);
  };

  const handleRestoreAllIngredients = () => {
    setShoppingState((prev) => ({
      ...prev,
      alreadyHaveIds: [],
    }));
    showToast('Todos los ingredientes restaurados a la lista');
  };

  const handleToggleChecked = (ingredientId) => {
    setShoppingState((prev) => {
      const exists = (prev.checkedIds || []).includes(ingredientId);
      return {
        ...prev,
        checkedIds: exists
          ? prev.checkedIds.filter((id) => id !== ingredientId)
          : [...(prev.checkedIds || []), ingredientId],
      };
    });
  };

  const handleAddExtraItem = (extraItem) => {
    setShoppingState((prev) => ({
      ...prev,
      extraItems: [...(prev.extraItems || []), extraItem],
    }));
    showToast(`"${extraItem.name}" añadido a la lista`);
  };

  const handleRemoveExtraItem = (manualId) => {
    setShoppingState((prev) => ({
      ...prev,
      extraItems: (prev.extraItems || []).filter((item) => item.id !== manualId),
    }));
    showToast('Producto eliminado de la lista');
  };

  const handleMoveCheckedToHave = (checkedItems) => {
    const manualIds = new Set(checkedItems.filter((i) => i.isManual).map((i) => i.manualId));
    const menuIds = checkedItems.filter((i) => !i.isManual).map((i) => i.id);

    setShoppingState((prev) => ({
      ...prev,
      extraItems: (prev.extraItems || []).filter((e) => !manualIds.has(e.id)),
      alreadyHaveIds: Array.from(new Set([...(prev.alreadyHaveIds || []), ...menuIds])),
      checkedIds: [],
    }));
    showToast('Productos marcados retirados de la lista definitiva');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        plannedDishesCount={plannedDishesCount}
        recipesCount={recipes.length}
        definitiveShoppingCount={definitiveShoppingCount}
      />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 sm:pb-12 sm:pt-6 lg:px-8">
        {activeTab === 'calendar' && (
          <WeeklyCalendar
            weeklyMenu={weeklyMenu}
            plannedDishesCount={plannedDishesCount}
            definitiveShoppingCount={definitiveShoppingCount}
            dietBalance={dietBalance}
            onAddDish={handleOpenAddDish}
            onEditDish={handleOpenEditDish}
            onDeleteDish={handleDeleteDish}
            onClearWeek={handleClearWeek}
            onGenerateBalancedWeek={handleGenerateBalancedWeek}
            onOpenShopping={() => setActiveTab('shopping')}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipesView
            recipes={recipes}
            onAddRecipe={handleAddRecipe}
            onUpdateRecipe={handleUpdateRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onAssignRecipeToMenu={handleAssignRecipeToMenu}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListView
            shoppingItems={shoppingItems}
            shoppingState={shoppingState}
            onMarkAlreadyHave={handleMarkAlreadyHave}
            onRestoreIngredient={handleRestoreIngredient}
            onRestoreAllIngredients={handleRestoreAllIngredients}
            onToggleChecked={handleToggleChecked}
            onAddExtraItem={handleAddExtraItem}
            onRemoveExtraItem={handleRemoveExtraItem}
            onMoveCheckedToHave={handleMoveCheckedToHave}
            onOpenCalendar={() => setActiveTab('calendar')}
            onNotify={showToast}
          />
        )}
      </main>

      <DishModal
        isOpen={dishModalState.isOpen}
        onClose={() => setDishModalState((prev) => ({ ...prev, isOpen: false }))}
        dayId={dishModalState.dayId}
        mealId={dishModalState.mealId}
        dishToEdit={dishModalState.dishToEdit}
        recipes={recipes}
        onSaveDish={handleSaveDish}
        onSaveAsRecipe={handleAddRecipe}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl sm:bottom-6 sm:text-sm"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
