import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Cloud,
  RefreshCw,
  X,
  Copy,
  Check,
  Users,
} from 'lucide-react';
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
import {
  DEFAULT_SYNC_ROOM_ID,
  SYNC_STORAGE_KEYS,
  fetchSharedState,
  pushSharedState,
} from './utils/cloudSync';
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
  const [previousMenuSnapshot, setPreviousMenuSnapshot] = useLocalStorage(
    STORAGE_KEYS.PREVIOUS_MENU,
    null,
  );
  const [shoppingState, setShoppingState] = useLocalStorage(
    STORAGE_KEYS.SHOPPING_STATE,
    DEFAULT_SHOPPING_STATE,
  );

  const [syncRoomId, setSyncRoomId] = useLocalStorage(
    SYNC_STORAGE_KEYS.ROOM_ID,
    DEFAULT_SYNC_ROOM_ID,
  );
  const [customSyncUrl, setCustomSyncUrl] = useLocalStorage(
    SYNC_STORAGE_KEYS.GAS_SYNC_URL,
    '',
  );

  const [syncStatus, setSyncStatus] = useState('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [roomInput, setRoomInput] = useState(syncRoomId);
  const [gasSyncInput, setGasSyncInput] = useState(customSyncUrl);
  const [copiedRoom, setCopiedRoom] = useState(false);

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

  // Referencias para sincronización bidireccional segura sin bucles
  const latestStateRef = useRef({
    recipes,
    weeklyMenu,
    previousMenuSnapshot,
    shoppingState,
  });
  latestStateRef.current = {
    recipes,
    weeklyMenu,
    previousMenuSnapshot,
    shoppingState,
  };

  const lastKnownRemoteTsRef = useRef(0);
  const dirtyRevisionRef = useRef(0);
  const pushTimerRef = useRef(null);

  const normalizeRecipesList = useCallback((list) => {
    if (!Array.isArray(list) || list.length === 0) return INITIAL_RECIPES;
    return list.map((r) => (r.dietGroup ? r : { ...r, dietGroup: inferDietGroup(r) }));
  }, []);

  const pullFromCloud = useCallback(
    async ({ notifyIfChanged = false, forceApply = false } = {}) => {
      setSyncStatus((prev) => (prev === 'saving' ? prev : 'syncing'));
      try {
        const remote = await fetchSharedState(syncRoomId, customSyncUrl);
        if (remote) {
          const remoteTs = Number(remote.updatedAt) || 0;
          const shouldApply =
            forceApply ||
            lastKnownRemoteTsRef.current === 0 ||
            (remoteTs > lastKnownRemoteTsRef.current && dirtyRevisionRef.current === 0);

          if (shouldApply) {
            const nextRecipes = normalizeRecipesList(remote.recipes);
            const nextMenu = remote.weeklyMenu;
            const nextPrevSnapshot =
              remote.previousMenuSnapshot !== undefined
                ? remote.previousMenuSnapshot
                : latestStateRef.current.previousMenuSnapshot;
            const nextShopping = remote.shoppingState || DEFAULT_SHOPPING_STATE;

            setRecipes(nextRecipes);
            setWeeklyMenu(nextMenu);
            setPreviousMenuSnapshot(nextPrevSnapshot);
            setShoppingState(nextShopping);
            latestStateRef.current = {
              recipes: nextRecipes,
              weeklyMenu: nextMenu,
              previousMenuSnapshot: nextPrevSnapshot,
              shoppingState: nextShopping,
            };

            const hadPriorSync = lastKnownRemoteTsRef.current > 0 && remoteTs > lastKnownRemoteTsRef.current;
            lastKnownRemoteTsRef.current = remoteTs || Date.now();
            if (notifyIfChanged && hadPriorSync) {
              showToast('Menú actualizado con los cambios compartidos');
            }
          }
          setSyncStatus('synced');
          setLastSyncedAt(Date.now());
        } else {
          // Sala vacía nueva: inicializar con el estado actual
          const current = latestStateRef.current;
          const stamp = Date.now();
          await pushSharedState(
            syncRoomId,
            {
              ...current,
              updatedAt: stamp,
              updatedBy: 'MenuPlan',
            },
            customSyncUrl,
          );
          lastKnownRemoteTsRef.current = stamp;
          setSyncStatus('synced');
          setLastSyncedAt(Date.now());
        }
      } catch {
        setSyncStatus('offline');
      }
    },
    [
      syncRoomId,
      customSyncUrl,
      normalizeRecipesList,
      setRecipes,
      setWeeklyMenu,
      setPreviousMenuSnapshot,
      setShoppingState,
      showToast,
    ],
  );

  const scheduleCloudPush = useCallback(
    (nextRecipes, nextMenu, nextShopping, nextPrevSnapshot = latestStateRef.current.previousMenuSnapshot) => {
      dirtyRevisionRef.current += 1;
      const myRevision = dirtyRevisionRef.current;
      setSyncStatus('saving');

      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current);
      }

      pushTimerRef.current = setTimeout(async () => {
        const stamp = Math.max(Date.now(), lastKnownRemoteTsRef.current + 1);
        try {
          await pushSharedState(
            syncRoomId,
            {
              recipes: nextRecipes,
              weeklyMenu: nextMenu,
              previousMenuSnapshot: nextPrevSnapshot,
              shoppingState: nextShopping,
              updatedAt: stamp,
              updatedBy: 'MenuPlan',
            },
            customSyncUrl,
          );
          lastKnownRemoteTsRef.current = stamp;
          if (dirtyRevisionRef.current === myRevision) {
            dirtyRevisionRef.current = 0;
            setSyncStatus('synced');
            setLastSyncedAt(Date.now());
          }
        } catch {
          setSyncStatus('offline');
        }
      }, 450);
    },
    [syncRoomId, customSyncUrl],
  );

  // Sincronización inicial, al volver a la pestaña y cada 15 segundos
  useEffect(() => {
    pullFromCloud({ notifyIfChanged: false, forceApply: true });

    const intervalId = setInterval(() => {
      pullFromCloud({ notifyIfChanged: true });
    }, 15000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        pullFromCloud({ notifyIfChanged: true });
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [pullFromCloud]);

  const applyRecipesChange = useCallback(
    (updater) => {
      const prev = latestStateRef.current.recipes;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      latestStateRef.current.recipes = next;
      setRecipes(next);
      scheduleCloudPush(
        next,
        latestStateRef.current.weeklyMenu,
        latestStateRef.current.shoppingState,
      );
      return next;
    },
    [setRecipes, scheduleCloudPush],
  );

  const applyMenuChange = useCallback(
    (updater) => {
      const prev = latestStateRef.current.weeklyMenu;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      latestStateRef.current.weeklyMenu = next;
      setWeeklyMenu(next);
      scheduleCloudPush(
        latestStateRef.current.recipes,
        next,
        latestStateRef.current.shoppingState,
      );
      return next;
    },
    [setWeeklyMenu, scheduleCloudPush],
  );

  const applyShoppingChange = useCallback(
    (updater) => {
      const prev = latestStateRef.current.shoppingState;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      latestStateRef.current.shoppingState = next;
      setShoppingState(next);
      scheduleCloudPush(
        latestStateRef.current.recipes,
        latestStateRef.current.weeklyMenu,
        next,
      );
      return next;
    },
    [setShoppingState, scheduleCloudPush],
  );

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
    applyMenuChange((prev) => {
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
    showToast(
      isEditing
        ? `Plato "${dishPayload.name}" actualizado para ambos`
        : `"${dishPayload.name}" añadido al menú compartido`,
    );
  };

  const handleDeleteDish = (dayId, mealId, dishId) => {
    applyMenuChange((prev) => {
      const safeDay = prev[dayId] || { desayuno: [], comida: [], cena: [] };
      return {
        ...prev,
        [dayId]: {
          ...safeDay,
          [mealId]: (safeDay[mealId] || []).filter((d) => d.id !== dishId),
        },
      };
    });
    showToast('Plato eliminado del calendario compartido');
  };

  const countMenuDishes = useCallback((menuObj) => {
    let count = 0;
    for (const day of DAYS) {
      for (const meal of MEAL_TYPES) {
        count += menuObj?.[day.id]?.[meal.id]?.length || 0;
      }
    }
    return count;
  }, []);

  const handleClearWeek = () => {
    const currentMenu = latestStateRef.current.weeklyMenu;
    if (countMenuDishes(currentMenu) > 0) {
      const backup = { menu: currentMenu, savedAt: Date.now() };
      latestStateRef.current.previousMenuSnapshot = backup;
      setPreviousMenuSnapshot(backup);
    }
    applyMenuChange(createEmptyMenu());
    showToast('Calendario semanal vaciado (puedes recuperar el menú anterior)');
  };

  const handleGenerateBalancedWeek = () => {
    const currentMenu = latestStateRef.current.weeklyMenu;
    if (countMenuDishes(currentMenu) > 0) {
      const backup = { menu: currentMenu, savedAt: Date.now() };
      latestStateRef.current.previousMenuSnapshot = backup;
      setPreviousMenuSnapshot(backup);
    }

    const currentRecipes = latestStateRef.current.recipes;
    const sourceRecipes = currentRecipes.length > 0 ? currentRecipes : INITIAL_RECIPES;
    if (currentRecipes.length === 0) {
      applyRecipesChange(INITIAL_RECIPES);
    }
    applyMenuChange(generateBalancedWeeklyMenu(sourceRecipes, DEFAULT_SERVINGS));
    showToast('Nuevo menú equilibrado generado (el anterior sigue recuperable)');
  };

  const handleRestorePreviousMenu = () => {
    const snapshot = latestStateRef.current.previousMenuSnapshot;
    if (!snapshot?.menu) return;

    const currentMenu = latestStateRef.current.weeklyMenu;
    const nextBackup =
      countMenuDishes(currentMenu) > 0
        ? { menu: currentMenu, savedAt: Date.now() }
        : null;

    latestStateRef.current.previousMenuSnapshot = nextBackup;
    setPreviousMenuSnapshot(nextBackup);
    applyMenuChange(snapshot.menu);
    showToast('Menú anterior recuperado y sincronizado');
  };

  const handleAddRecipe = (recipeData) => {
    const created = { ...recipeData, id: recipeData.id || generateId('rec') };
    applyRecipesChange((prev) => [created, ...prev]);
    showToast(`Receta "${created.name}" guardada y compartida`);
    return created;
  };

  const handleAddRecipesBatch = (recipesList = []) => {
    const valid = recipesList
      .filter((r) => r && r.name && r.name.trim())
      .map((r) => ({ ...r, id: r.id || generateId('rec') }));
    if (valid.length === 0) return [];
    applyRecipesChange((prev) => [...valid, ...prev]);
    showToast(
      valid.length === 1
        ? `Receta "${valid[0].name}" guardada y compartida`
        : `${valid.length} recetas importadas y compartidas`,
    );
    return valid;
  };

  const handleUpdateRecipe = (updatedRecipe) => {
    applyRecipesChange((prev) => prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)));
    showToast(`Receta "${updatedRecipe.name}" actualizada`);
  };

  const handleDeleteRecipe = (recipeId) => {
    applyRecipesChange((prev) => prev.filter((r) => r.id !== recipeId));
    showToast('Receta eliminada del recetario compartido');
  };

  const handleAssignRecipeToMenu = (dayId, mealId, dish) => {
    handleSaveDish(dayId, mealId, dish, false);
  };

  const handleMarkAlreadyHave = (ingredientId, name) => {
    applyShoppingChange((prev) => ({
      ...prev,
      alreadyHaveIds: Array.from(new Set([...(prev.alreadyHaveIds || []), ingredientId])),
      checkedIds: (prev.checkedIds || []).filter((id) => id !== ingredientId),
    }));
    showToast(`"${name}" eliminado de la lista definitiva`);
  };

  const handleRestoreIngredient = (ingredientId, name) => {
    applyShoppingChange((prev) => ({
      ...prev,
      alreadyHaveIds: (prev.alreadyHaveIds || []).filter((id) => id !== ingredientId),
    }));
    showToast(`"${name}" restaurado en la lista`);
  };

  const handleRestoreAllIngredients = () => {
    applyShoppingChange((prev) => ({
      ...prev,
      alreadyHaveIds: [],
    }));
    showToast('Todos los ingredientes restaurados');
  };

  const handleToggleChecked = (ingredientId) => {
    applyShoppingChange((prev) => {
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
    applyShoppingChange((prev) => ({
      ...prev,
      extraItems: [...(prev.extraItems || []), extraItem],
    }));
    showToast(`"${extraItem.name}" añadido a la lista compartida`);
  };

  const handleRemoveExtraItem = (manualId) => {
    applyShoppingChange((prev) => ({
      ...prev,
      extraItems: (prev.extraItems || []).filter((item) => item.id !== manualId),
    }));
    showToast('Producto eliminado de la lista');
  };

  const handleMoveCheckedToHave = (checkedItems) => {
    const manualIds = new Set(checkedItems.filter((i) => i.isManual).map((i) => i.manualId));
    const menuIds = checkedItems.filter((i) => !i.isManual).map((i) => i.id);

    applyShoppingChange((prev) => ({
      ...prev,
      extraItems: (prev.extraItems || []).filter((e) => !manualIds.has(e.id)),
      alreadyHaveIds: Array.from(new Set([...(prev.alreadyHaveIds || []), ...menuIds])),
      checkedIds: [],
    }));
    showToast('Productos marcados retirados de la lista definitiva');
  };

  const handleOpenSyncModal = () => {
    setRoomInput(syncRoomId);
    setGasSyncInput(customSyncUrl);
    setSyncModalOpen(true);
  };

  const handleSaveSyncSettings = (e) => {
    e.preventDefault();
    const nextRoom = roomInput.trim() || DEFAULT_SYNC_ROOM_ID;
    const nextGas = gasSyncInput.trim();
    lastKnownRemoteTsRef.current = 0;
    dirtyRevisionRef.current = 0;
    setSyncRoomId(nextRoom);
    setCustomSyncUrl(nextGas);
    setSyncModalOpen(false);
    showToast('Sincronizando con la sala compartida...');
  };

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(syncRoomId);
      setCopiedRoom(true);
      setTimeout(() => setCopiedRoom(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        plannedDishesCount={plannedDishesCount}
        recipesCount={recipes.length}
        definitiveShoppingCount={definitiveShoppingCount}
        syncStatus={syncStatus}
        onOpenSyncModal={handleOpenSyncModal}
      />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 sm:pb-12 sm:pt-6 lg:px-8">
        {activeTab === 'calendar' && (
          <WeeklyCalendar
            weeklyMenu={weeklyMenu}
            recipes={recipes}
            plannedDishesCount={plannedDishesCount}
            definitiveShoppingCount={definitiveShoppingCount}
            dietBalance={dietBalance}
            hasPreviousMenu={Boolean(previousMenuSnapshot?.menu)}
            previousMenuSavedAt={previousMenuSnapshot?.savedAt || null}
            onAddDish={handleOpenAddDish}
            onEditDish={handleOpenEditDish}
            onDeleteDish={handleDeleteDish}
            onClearWeek={handleClearWeek}
            onGenerateBalancedWeek={handleGenerateBalancedWeek}
            onRestorePreviousMenu={handleRestorePreviousMenu}
            onOpenShopping={() => setActiveTab('shopping')}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipesView
            recipes={recipes}
            onAddRecipe={handleAddRecipe}
            onAddRecipesBatch={handleAddRecipesBatch}
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

      {syncModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sync-modal-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-emerald-600" />
                <h2 id="sync-modal-title" className="text-lg font-bold text-slate-900">
                  Sincronización en la Nube
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSyncModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSyncSettings} className="space-y-4 px-5 py-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
                <p className="flex items-center gap-1.5 font-bold">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Menú, recetas y lista compartidos en tiempo real
                </p>
                <p className="mt-1 leading-relaxed text-emerald-900">
                  Cualquier cambio que hagáis Miguel o Rosa desde el ordenador o el móvil se guarda automáticamente en la nube y aparece en el dispositivo del otro en pocos segundos.
                </p>
                {lastSyncedAt && (
                  <p className="mt-1.5 font-semibold text-emerald-700">
                    Última sincronización: {new Date(lastSyncedAt).toLocaleTimeString('es-ES')}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Código de sala compartida
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyRoomCode}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {copiedRoom ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedRoom ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  URL Apps Script propia (opcional)
                </label>
                <input
                  type="url"
                  value={gasSyncInput}
                  onChange={(e) => setGasSyncInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec (dejar vacío para nube automática)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => pullFromCloud({ notifyIfChanged: false, forceApply: true })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sincronizar ahora
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSyncModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Guardar sala
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
