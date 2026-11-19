export const STORAGE_KEYS = {
  RECIPES: 'menuplan_recipes_v1',
  WEEKLY_MENU: 'menuplan_weekly_menu_v1',
  PREVIOUS_MENU: 'menuplan_previous_menu_v1',
  SHOPPING_STATE: 'menuplan_shopping_state_v1',
};

export const DEFAULT_SERVINGS = 2;

export const DAYS = [
  { id: 'lunes', label: 'Lunes', shortLabel: 'Lun' },
  { id: 'martes', label: 'Martes', shortLabel: 'Mar' },
  { id: 'miercoles', label: 'Miércoles', shortLabel: 'Mié' },
  { id: 'jueves', label: 'Jueves', shortLabel: 'Jue' },
  { id: 'viernes', label: 'Viernes', shortLabel: 'Vie' },
  { id: 'sabado', label: 'Sábado', shortLabel: 'Sáb' },
  { id: 'domingo', label: 'Domingo', shortLabel: 'Dom' },
];

export const MEAL_TYPES = [
  {
    id: 'desayuno',
    label: 'Desayuno',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    pillClass: 'bg-amber-100 text-amber-800',
    accentBorder: 'border-l-amber-400',
    headerBg: 'bg-amber-50/70',
    iconColor: 'text-amber-600',
  },
  {
    id: 'comida',
    label: 'Comida',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    pillClass: 'bg-emerald-100 text-emerald-800',
    accentBorder: 'border-l-emerald-500',
    headerBg: 'bg-emerald-50/70',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'cena',
    label: 'Cena',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    pillClass: 'bg-indigo-100 text-indigo-800',
    accentBorder: 'border-l-indigo-500',
    headerBg: 'bg-indigo-50/70',
    iconColor: 'text-indigo-600',
  },
];

export const DIET_GROUPS = [
  {
    id: 'legumbres',
    label: 'Legumbres',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    targetWeekly: 3,
  },
  {
    id: 'verduras',
    label: 'Verduras',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    targetWeekly: 4,
  },
  {
    id: 'pescado',
    label: 'Pescado',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500',
    targetWeekly: 4,
  },
  {
    id: 'carnes_blancas',
    label: 'Carnes blancas',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
    targetWeekly: 3,
  },
  {
    id: 'desayuno_integral',
    label: 'Desayuno',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
    dotClass: 'bg-violet-500',
    targetWeekly: 7,
  },
];

export const INGREDIENT_CATEGORIES = [
  {
    id: 'Frutas y Verduras',
    label: 'Frutas y Verduras',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  {
    id: 'Carnes y Pescados',
    label: 'Carnes y Pescados',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  {
    id: 'Lácteos y Huevos',
    label: 'Lácteos y Huevos',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
  },
  {
    id: 'Despensa y Cereales',
    label: 'Despensa y Cereales',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  {
    id: 'Panadería',
    label: 'Panadería',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    dotClass: 'bg-orange-500',
  },
  {
    id: 'Condimentos y Otros',
    label: 'Condimentos y Otros',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  },
];

export const UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'ud',
  'cda',
  'cdta',
  'taza',
  'rebanada',
  'diente',
  'manojo',
  'pizca',
];

export function generateId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function formatAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '';
  const rounded = Math.round(num * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
}

export function inferDietGroup(item = {}) {
  if (item.dietGroup && DIET_GROUPS.some((g) => g.id === item.dietGroup)) {
    return item.dietGroup;
  }

  if (item.mealCategory === 'desayuno') {
    return 'desayuno_integral';
  }

  const text = [
    item.name || '',
    item.description || '',
    ...(item.ingredients || []).map((i) => i.name || ''),
  ]
    .join(' ')
    .toLowerCase();

  if (/(lenteja|garbanzo|alubia|jud[ií]as?\s+(?:blancas?|pintas?|rojas?|negras?|secas?)|habichuela|fabada|hummus|soja|edamame|lentil|chickpea|bean)/.test(text)) {
    return 'legumbres';
  }
  if (/(salm[oó]n|salmon|merluza|bacalao|at[uú]n|tuna|dorada|lubina|trucha|sardina|pescado|fish|cod|hake|gamba|langostino|calamar|pulpo|mejill[oó]n)/.test(text)) {
    return 'pescado';
  }
  if (/(pollo|pavo|conejo|pechuga|chicken|turkey)/.test(text)) {
    return 'carnes_blancas';
  }
  return 'verduras';
}

export function scaleIngredients(ingredients = [], baseServings = DEFAULT_SERVINGS, targetServings = DEFAULT_SERVINGS) {
  const safeBase = Math.max(1, Number(baseServings) || 1);
  const safeTarget = Math.max(1, Number(targetServings) || DEFAULT_SERVINGS);
  const ratio = safeTarget / safeBase;

  return ingredients.map((ing) => {
    const isFixedUnit = ing.unit === 'pizca' || ing.keepFixed;
    return {
      ...ing,
      id: generateId('ing'),
      amount: isFixedUnit
        ? Number(ing.amount) || 1
        : Math.round((Number(ing.amount) || 0) * ratio * 100) / 100,
    };
  });
}

export function createDishFromRecipe(recipe, servings = DEFAULT_SERVINGS) {
  const targetServings = Math.max(1, Number(servings) || recipe.servings || DEFAULT_SERVINGS);
  return {
    id: generateId('dish'),
    recipeId: recipe.id,
    name: recipe.name,
    servings: targetServings,
    dietGroup: recipe.dietGroup || inferDietGroup(recipe),
    prepTime: recipe.prepTime || 20,
    description: recipe.description || '',
    steps: Array.isArray(recipe.steps) ? [...recipe.steps] : [],
    notes: '',
    ingredients: scaleIngredients(recipe.ingredients, recipe.servings || DEFAULT_SERVINGS, targetServings),
  };
}

export function createEmptyMenu() {
  const menu = {};
  for (const day of DAYS) {
    menu[day.id] = {
      desayuno: [],
      comida: [],
      cena: [],
    };
  }
  return menu;
}

export function normalizeIngredientKey(name = '', unit = '') {
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, ' ');
  const cleanUnit = unit.trim().toLowerCase();
  return `${cleanName}::${cleanUnit}`;
}

function stripDiacritics(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const CANONICAL_INGREDIENT_MAP = new Map([
  ['aove', 'Aceite de oliva'],
  ['aceite de oliva', 'Aceite de oliva'],
  ['aceite de oliva virgen', 'Aceite de oliva'],
  ['aceite de oliva virgen extra', 'Aceite de oliva'],
  ['aceite oliva', 'Aceite de oliva'],
  ['aguacate', 'Aguacate'],
  ['aguacates', 'Aguacate'],
  ['ajo', 'Ajo'],
  ['ajos', 'Ajo'],
  ['diente de ajo', 'Ajo'],
  ['dientes de ajo', 'Ajo'],
  ['cebolla', 'Cebolla'],
  ['cebollas', 'Cebolla'],
  ['cebolla blanca', 'Cebolla'],
  ['cebolla morada', 'Cebolla morada'],
  ['cebolla o cebolleta', 'Cebolla'],
  ['huevo', 'Huevo'],
  ['huevos', 'Huevo'],
  ['huevo de gallina', 'Huevo'],
  ['clara de huevo', 'Clara de huevo'],
  ['claras de huevo', 'Clara de huevo'],
  ['patata', 'Patata'],
  ['patatas', 'Patata'],
  ['tomate', 'Tomate'],
  ['tomates', 'Tomate'],
  ['tomate crudo', 'Tomate'],
  ['tomate maduro', 'Tomate'],
  ['tomate de ensalada', 'Tomate'],
  ['tomate natural', 'Tomate'],
  ['tomate natural triturado', 'Tomate triturado'],
  ['tomate triturado', 'Tomate triturado'],
  ['tomate triturado natural', 'Tomate triturado'],
  ['tomate cherry', 'Tomates cherry'],
  ['tomates cherry', 'Tomates cherry'],
  ['pimiento rojo', 'Pimiento rojo'],
  ['pimientos rojos', 'Pimiento rojo'],
  ['pimiento verde', 'Pimiento verde'],
  ['pimientos verdes', 'Pimiento verde'],
  ['zanahoria', 'Zanahoria'],
  ['zanahorias', 'Zanahoria'],
  ['calabacin', 'Calabacín'],
  ['calabacines', 'Calabacín'],
  ['platano', 'Plátano'],
  ['platanos', 'Plátano'],
  ['limon', 'Limón'],
  ['limones', 'Limón'],
  ['zumo de limon', 'Zumo de limón'],
  ['sal', 'Sal'],
  ['sal comun', 'Sal'],
  ['sal yodada', 'Sal'],
  ['sal marina', 'Sal'],
  ['sal fina', 'Sal'],
  ['pimienta', 'Pimienta'],
  ['pimienta negra', 'Pimienta negra'],
  ['perejil', 'Perejil fresco'],
  ['perejil fresco', 'Perejil fresco'],
  ['oregano', 'Orégano'],
  ['atun al natural', 'Atún al natural'],
  ['atun al natural en conserva', 'Atún al natural'],
  ['lomos de merluza', 'Merluza'],
  ['merluza', 'Merluza'],
  ['lomos de salmon', 'Salmón'],
  ['salmon', 'Salmón'],
  ['lomos de bacalao', 'Bacalao'],
  ['lomos de bacalao fresco', 'Bacalao'],
  ['lomos de bacalao desalado', 'Bacalao desalado'],
  ['lomos de dorada', 'Dorada'],
  ['dorada', 'Dorada'],
]);

export function canonicalizeIngredientName(rawName = '') {
  let clean = String(rawName || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(?:al gusto|aprox\.?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[,.;:\-\s]+|[,.;:\-\s]+$/g, '')
    .trim();

  if (!clean) return { key: '', displayName: '' };

  const asciiLower = stripDiacritics(clean).toLowerCase().replace(/\s+/g, ' ').trim();
  if (CANONICAL_INGREDIENT_MAP.has(asciiLower)) {
    const mapped = CANONICAL_INGREDIENT_MAP.get(asciiLower);
    return {
      key: stripDiacritics(mapped).toLowerCase(),
      displayName: mapped,
    };
  }

  // Normalizar plural simple terminado en "-s" si no termina en "s" originalmente (p.ej. pepinos -> pepino, kiwis -> kiwi)
  let displayName = clean.charAt(0).toUpperCase() + clean.slice(1);
  let key = asciiLower;

  if (asciiLower.length > 4 && asciiLower.endsWith('es') && !/(?:ques|cues|ces|tes|nes)$/.test(asciiLower)) {
    const singularTry = asciiLower.slice(0, -2);
    if (CANONICAL_INGREDIENT_MAP.has(singularTry)) {
      const mapped = CANONICAL_INGREDIENT_MAP.get(singularTry);
      return { key: stripDiacritics(mapped).toLowerCase(), displayName: mapped };
    }
  } else if (asciiLower.length > 4 && asciiLower.endsWith('s') && !asciiLower.endsWith('ss') && !/(?:es|us|is|os)$/.test(asciiLower)) {
    key = asciiLower.slice(0, -1);
    const trimmedOrig = clean.slice(0, -1);
    displayName = trimmedOrig.charAt(0).toUpperCase() + trimmedOrig.slice(1);
  }

  return { key, displayName };
}

function normalizeUnitForAggregation(rawUnit = '', rawAmount = 0) {
  const unitLower = String(rawUnit || 'ud').trim().toLowerCase();
  const amount = Number(rawAmount) || 0;

  if (unitLower === 'kg') return { unit: 'g', amount: Math.round(amount * 1000 * 100) / 100 };
  if (unitLower === 'l' || unitLower === 'litro' || unitLower === 'litros') {
    return { unit: 'ml', amount: Math.round(amount * 1000 * 100) / 100 };
  }
  if (/^(uds?|unidades?)$/.test(unitLower)) return { unit: 'ud', amount };
  if (!unitLower) return { unit: 'ud', amount };
  return { unit: unitLower, amount };
}

const UNIT_SORT_ORDER = ['ud', 'lata', 'rebanada', 'diente', 'manojo', 'taza', 'cda', 'cdta', 'g', 'ml', 'pizca'];

export function formatCombinedQuantities(quantitiesByUnit = {}) {
  const entries = Object.entries(quantitiesByUnit).filter(([, val]) => Number(val) > 0);
  if (entries.length === 0) return '';

  // Si hay unidades medidas (g, ml, ud, cda...), omitir "pizca" redundante al fusionar el mismo ingrediente
  const hasMeasured = entries.some(([u]) => u !== 'pizca');
  const filtered = hasMeasured ? entries.filter(([u]) => u !== 'pizca') : entries;

  filtered.sort(([uA], [uB]) => {
    const iA = UNIT_SORT_ORDER.indexOf(uA);
    const iB = UNIT_SORT_ORDER.indexOf(uB);
    return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
  });

  return filtered
    .map(([unit, rawVal]) => {
      if (unit === 'pizca' && filtered.length === 1) return 'al gusto';
      if (unit === 'g' && rawVal >= 1000 && rawVal % 100 === 0) {
        return `${formatAmount(rawVal / 1000)} kg`;
      }
      if (unit === 'ml' && rawVal >= 1000 && rawVal % 100 === 0) {
        return `${formatAmount(rawVal / 1000)} l`;
      }
      return `${formatAmount(rawVal)} ${unit}`;
    })
    .join(' + ');
}

export function getShoppingItemAmountDisplay(item) {
  if (!item) return '';
  if (item.amountDisplay) return item.amountDisplay;
  if (item.quantities) return formatCombinedQuantities(item.quantities);
  if (item.amount > 0) return `${formatAmount(item.amount)} ${item.unit || 'ud'}`.trim();
  return '';
}

export function buildShoppingList(weeklyMenu, extraItems = []) {
  const aggregated = new Map();

  const mergeEntry = ({ name, amount, unit, category, sourceLabel, manualId = null }) => {
    const { key, displayName } = canonicalizeIngredientName(name);
    if (!key) return;

    const norm = normalizeUnitForAggregation(unit, amount);
    if (norm.amount <= 0) return;

    if (aggregated.has(key)) {
      const current = aggregated.get(key);
      current.quantities[norm.unit] =
        Math.round(((current.quantities[norm.unit] || 0) + norm.amount) * 100) / 100;
      if (sourceLabel && !current.sources.includes(sourceLabel)) {
        current.sources.push(sourceLabel);
      }
      if (manualId) {
        current.manualIds.push(manualId);
      }
      current.isManual = current.isManual && Boolean(manualId);
    } else {
      aggregated.set(key, {
        id: `ing::${key}`,
        manualId: manualId || null,
        manualIds: manualId ? [manualId] : [],
        name: displayName,
        quantities: { [norm.unit]: norm.amount },
        amount: norm.amount,
        unit: norm.unit,
        category: category || 'Condimentos y Otros',
        sources: sourceLabel ? [sourceLabel] : [],
        isManual: Boolean(manualId),
      });
    }
  };

  for (const day of DAYS) {
    const dayMeals = weeklyMenu?.[day.id];
    if (!dayMeals) continue;

    for (const meal of MEAL_TYPES) {
      const dishes = dayMeals[meal.id] || [];
      for (const dish of dishes) {
        const ingredients = dish.ingredients || [];
        for (const ing of ingredients) {
          const cleanName = (ing.name || '').trim();
          if (!cleanName) continue;
          mergeEntry({
            name: cleanName,
            amount: Number(ing.amount) || 0,
            unit: (ing.unit || 'ud').trim(),
            category: ing.category || 'Condimentos y Otros',
            sourceLabel: `${day.shortLabel} (${meal.label}): ${dish.name}`,
          });
        }
      }
    }
  }

  for (const extra of extraItems) {
    const cleanName = (extra.name || '').trim();
    if (!cleanName) continue;
    mergeEntry({
      name: cleanName,
      amount: Number(extra.amount) || 1,
      unit: (extra.unit || 'ud').trim(),
      category: extra.category || 'Condimentos y Otros',
      sourceLabel: 'Añadido manualmente',
      manualId: extra.id,
    });
  }

  return Array.from(aggregated.values())
    .map((entry) => {
      const amountDisplay = formatCombinedQuantities(entry.quantities);
      const unitEntries = Object.entries(entry.quantities);
      const [primaryUnit, primaryAmount] = unitEntries[0] || [entry.unit, entry.amount];
      return {
        ...entry,
        amount: primaryAmount,
        unit: primaryUnit,
        amountDisplay,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export const INITIAL_RECIPES = [
  {
    id: 'rec_tostadas_aguacate',
    name: 'Tostadas de aguacate y huevo poché',
    mealCategory: 'desayuno',
    dietGroup: 'desayuno_integral',
    prepTime: 12,
    servings: 2,
    description: 'Desayuno energético para 2 personas con pan integral crujiente, aguacate maduro y huevo poché.',
    steps: [
      'Tostar las rebanadas de pan integral hasta que queden crujientes.',
      'Machacar el aguacate con unas gotas de limón y una pizca de sal.',
      'Escalfar los huevos en agua hirviendo suave durante 3 minutos y servir encima.',
    ],
    ingredients: [
      { id: 'i1', name: 'Pan integral', amount: 4, unit: 'rebanada', category: 'Panadería' },
      { id: 'i2', name: 'Aguacate', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i3', name: 'Huevo', amount: 2, unit: 'ud', category: 'Lácteos y Huevos' },
      { id: 'i4', name: 'Aceite de oliva virgen', amount: 2, unit: 'cda', category: 'Condimentos y Otros' },
    ],
  },
  {
    id: 'rec_porridge_avena',
    name: 'Porridge de avena con frutos rojos',
    mealCategory: 'desayuno',
    dietGroup: 'desayuno_integral',
    prepTime: 10,
    servings: 2,
    description: 'Gachas cremosas de avena templadas con arándanos, frambuesas y nueces para 2 personas.',
    steps: [
      'Calentar la leche o bebida vegetal en un cazo con los copos de avena.',
      'Remover a fuego medio 5 minutos hasta que espese.',
      'Repartir en dos boles con los frutos rojos, nueces picadas y canela al gusto.',
    ],
    ingredients: [
      { id: 'i5', name: 'Copos de avena', amount: 100, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'i6', name: 'Leche entera o vegetal', amount: 500, unit: 'ml', category: 'Lácteos y Huevos' },
      { id: 'i7', name: 'Frutos rojos', amount: 160, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'i8', name: 'Nueces', amount: 40, unit: 'g', category: 'Despensa y Cereales' },
    ],
  },
  {
    id: 'rec_yogur_granola',
    name: 'Bol de yogur griego con plátano y granola',
    mealCategory: 'desayuno',
    dietGroup: 'desayuno_integral',
    prepTime: 5,
    servings: 2,
    description: 'Opción fresca y rápida rica en proteínas y fruta natural para 2 personas.',
    steps: [
      'Repartir el yogur griego en dos boles.',
      'Cortar los plátanos en rodajas y añadir junto con la granola crujiente.',
      'Terminar con una cucharadita de miel por persona.',
    ],
    ingredients: [
      { id: 'i9', name: 'Yogur griego natural', amount: 300, unit: 'g', category: 'Lácteos y Huevos' },
      { id: 'i10', name: 'Plátano', amount: 2, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i11', name: 'Granola sin azúcar', amount: 80, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'i12', name: 'Miel', amount: 2, unit: 'cdta', category: 'Condimentos y Otros' },
    ],
  },
  {
    id: 'rec_lentejas_verduras',
    name: 'Lentejas estofadas con verduras',
    mealCategory: 'comida',
    dietGroup: 'legumbres',
    prepTime: 35,
    servings: 2,
    description: 'Guiso casero de legumbres con zanahoria, calabacín, pimiento y laurel.',
    steps: [
      'Picar la cebolla, zanahoria, pimiento rojo y calabacín en dados pequeños.',
      'Sofreír las verduras con pimentón dulce y añadir las lentejas pardinas.',
      'Cubrir con agua o caldo y cocer a fuego suave 25 minutos.',
    ],
    ingredients: [
      { id: 'i19', name: 'Lentejas pardinas', amount: 180, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'i20', name: 'Zanahoria', amount: 2, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i21', name: 'Cebolla', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i22', name: 'Pimiento rojo', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i23', name: 'Calabacín', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i24', name: 'Pimentón dulce', amount: 1, unit: 'cdta', category: 'Condimentos y Otros' },
    ],
  },
  {
    id: 'rec_garbanzos_espinacas',
    name: 'Garbanzos salteados con espinacas y tomate',
    mealCategory: 'comida',
    dietGroup: 'legumbres',
    prepTime: 18,
    servings: 2,
    description: 'Receta rápida y saciante de legumbres con espinacas frescas, ajo y comino.',
    steps: [
      'Dorar los dientes de ajo laminados en aceite de oliva con una pizca de comino.',
      'Añadir el tomate triturado y sofreír 5 minutos.',
      'Incorporar los garbanzos cocidos y las espinacas frescas hasta que reduzcan.',
    ],
    ingredients: [
      { id: 'i43', name: 'Garbanzos cocidos', amount: 400, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'i44', name: 'Espinacas frescas', amount: 200, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'i45', name: 'Tomate triturado', amount: 200, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'i46', name: 'Ajo', amount: 2, unit: 'diente', category: 'Frutas y Verduras' },
      { id: 'i47', name: 'Aceite de oliva virgen', amount: 2, unit: 'cda', category: 'Condimentos y Otros' },
    ],
  },
  {
    id: 'rec_alubias_pisto',
    name: 'Alubias blancas con pisto de verduras',
    mealCategory: 'comida',
    dietGroup: 'legumbres',
    prepTime: 22,
    servings: 2,
    description: 'Plato completo de legumbre blanca combinado con pisto casero de berenjena y calabacín.',
    steps: [
      'Sofreír cebolla, pimiento verde, berenjena y calabacín en dados pequeños.',
      'Añadir tomate natural triturado y cocinar 10 minutos a fuego medio.',
      'Mezclar con las alubias blancas escurridas y dar un hervor suave de 5 minutos.',
    ],
    ingredients: [
      { id: 'i48', name: 'Alubias blancas cocidas', amount: 400, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'i49', name: 'Berenjena', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i50', name: 'Pimiento verde', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i51', name: 'Cebolla', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i52', name: 'Tomate triturado', amount: 200, unit: 'g', category: 'Despensa y Cereales' },
    ],
  },
  {
    id: 'rec_pollo_limon_arroz',
    name: 'Pollo al limón con arroz basmati y brócoli',
    mealCategory: 'comida',
    dietGroup: 'carnes_blancas',
    prepTime: 25,
    servings: 2,
    description: 'Carne blanca magra con pechuga jugosa al limón, arroz aromático y brócoli al vapor.',
    steps: [
      'Cocer el arroz basmati en agua con sal durante 12 minutos.',
      'Saltear las tiras de pollo con ajo, zumo de limón y aceite de oliva.',
      'Cocinar el brócoli al vapor 5 minutos para que quede al dente y servir junto.',
    ],
    ingredients: [
      { id: 'i13', name: 'Pechuga de pollo', amount: 300, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'i14', name: 'Arroz basmati', amount: 150, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'i15', name: 'Brócoli', amount: 250, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'i16', name: 'Limón', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i17', name: 'Ajo', amount: 2, unit: 'diente', category: 'Frutas y Verduras' },
      { id: 'i18', name: 'Aceite de oliva virgen', amount: 2, unit: 'cda', category: 'Condimentos y Otros' },
    ],
  },
  {
    id: 'rec_pavo_calabacin',
    name: 'Pechuga de pavo salteada con calabacín y champiñones',
    mealCategory: 'cena',
    dietGroup: 'carnes_blancas',
    prepTime: 18,
    servings: 2,
    description: 'Cena ligera de carne blanca con salteado de verduras y hierbas provenzales.',
    steps: [
      'Cortar el pavo en dados y salpimentar.',
      'Saltear a fuego vivo con aceite de oliva hasta dorar y reservar.',
      'Saltear los champiñones laminados y el calabacín, reincorporar el pavo y servir.',
    ],
    ingredients: [
      { id: 'i53', name: 'Pechuga de pavo', amount: 300, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'i54', name: 'Champiñones', amount: 200, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'i55', name: 'Calabacín', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i56', name: 'Aceite de oliva virgen', amount: 2, unit: 'cda', category: 'Condimentos y Otros' },
    ],
  },
  {
    id: 'rec_pollo_curry_verduras',
    name: 'Pollo suave al curry con verduras y cuscús',
    mealCategory: 'comida',
    dietGroup: 'carnes_blancas',
    prepTime: 25,
    servings: 2,
    description: 'Pechuga de pollo jugosa con zanahoria, pimiento y cuscús integral.',
    steps: [
      'Saltear cebolla, zanahoria y pimiento con una cucharadita de curry suave.',
      'Añadir los dados de pollo y leche evaporada o bebida de coco ligera, cocer 10 minutos.',
      'Hidratar el cuscús con agua caliente tapado 5 minutos y acompañar.',
    ],
    ingredients: [
      { id: 'i57', name: 'Pechuga de pollo', amount: 300, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'i58', name: 'Cuscús integral', amount: 140, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'i59', name: 'Zanahoria', amount: 2, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i60', name: 'Pimiento rojo', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i61', name: 'Leche evaporada', amount: 150, unit: 'ml', category: 'Lácteos y Huevos' },
    ],
  },
  {
    id: 'rec_salmon_horno',
    name: 'Salmón al horno con patatas y espárragos',
    mealCategory: 'cena',
    dietGroup: 'pescado',
    prepTime: 30,
    servings: 2,
    description: 'Pescado azul rico en omega-3 listo en una sola bandeja de horno para 2 personas.',
    steps: [
      'Cortar las patatas en rodajas finas y hornear 15 minutos a 200 °C con aceite y sal.',
      'Añadir los lomos de salmón y los espárragos verdes a la bandeja.',
      'Hornear otros 12 minutos con rodajas de limón por encima.',
    ],
    ingredients: [
      { id: 'i29', name: 'Lomos de salmón', amount: 300, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'i30', name: 'Patatas', amount: 350, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'i31', name: 'Espárragos verdes', amount: 1, unit: 'manojo', category: 'Frutas y Verduras' },
      { id: 'i32', name: 'Limón', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i33', name: 'Aceite de oliva virgen', amount: 2, unit: 'cda', category: 'Condimentos y Otros' },
    ],
  },
  {
    id: 'rec_merluza_salsa_verde',
    name: 'Merluza en salsa verde con guisantes',
    mealCategory: 'comida',
    dietGroup: 'pescado',
    prepTime: 25,
    servings: 2,
    description: 'Pescado blanco tierno en cazuela ligera con ajo, perejil, guisantes y patata.',
    steps: [
      'Sofreír ajo picado en aceite de oliva y añadir media cucharada de harina o maicena.',
      'Incorporar caldo de pescado o agua, perejil fresco picado, patata en rodajas y guisantes.',
      'Cocer 12 minutos y añadir los lomos de merluza 5 minutos hasta que estén jugosos.',
    ],
    ingredients: [
      { id: 'i62', name: 'Lomos de merluza', amount: 350, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'i63', name: 'Guisantes', amount: 150, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'i64', name: 'Patatas', amount: 250, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'i65', name: 'Ajo', amount: 2, unit: 'diente', category: 'Frutas y Verduras' },
      { id: 'i66', name: 'Perejil fresco', amount: 1, unit: 'manojo', category: 'Frutas y Verduras' },
    ],
  },
  {
    id: 'rec_dorada_plancha',
    name: 'Lomos de dorada a la plancha con verduras asadas',
    mealCategory: 'cena',
    dietGroup: 'pescado',
    prepTime: 22,
    servings: 2,
    description: 'Cena saludable de pescado blanco con pimiento, cebolla morada y calabacín.',
    steps: [
      'Asar o saltear las verduras cortadas en tiras con aceite de oliva y sal.',
      'Marcar los lomos de dorada por el lado de la piel 4 minutos y dar la vuelta 2 minutos.',
      'Servir con un chorrito de limón y las verduras.',
    ],
    ingredients: [
      { id: 'i67', name: 'Lomos de dorada', amount: 320, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'i68', name: 'Calabacín', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i69', name: 'Cebolla morada', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i70', name: 'Limón', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
    ],
  },
  {
    id: 'rec_atun_encebollado',
    name: 'Atún encebollado con arroz integral',
    mealCategory: 'comida',
    dietGroup: 'pescado',
    prepTime: 25,
    servings: 2,
    description: 'Plato tradicional de pescado azul con cebolla pochada, laurel y arroz integral.',
    steps: [
      'Cocer el arroz integral en agua con sal durante 20 minutos.',
      'Pochar la cebolla en juliana a fuego suave con laurel y pimentón.',
      'Añadir los tacos de atún salpimentados 3 minutos para que queden jugosos.',
    ],
    ingredients: [
      { id: 'i71', name: 'Atún fresco', amount: 300, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'i72', name: 'Cebolla', amount: 2, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i73', name: 'Arroz integral', amount: 140, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'i74', name: 'Aceite de oliva virgen', amount: 2, unit: 'cda', category: 'Condimentos y Otros' },
    ],
  },
  {
    id: 'rec_crema_calabacin',
    name: 'Crema de calabacín con queso feta',
    mealCategory: 'cena',
    dietGroup: 'verduras',
    prepTime: 25,
    servings: 2,
    description: 'Crema de verduras suave y ligera ideal para cenar con queso feta desmenuzado.',
    steps: [
      'Rehogar el puerro y el calabacín troceados durante 5 minutos.',
      'Añadir la patata y caldo de verduras, y cocer 15 minutos.',
      'Triturar hasta lograr textura sedosa y servir con queso feta desmenuzado.',
    ],
    ingredients: [
      { id: 'i34', name: 'Calabacín', amount: 2, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i35', name: 'Puerro', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i36', name: 'Patatas', amount: 150, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'i37', name: 'Queso feta', amount: 60, unit: 'g', category: 'Lácteos y Huevos' },
      { id: 'i38', name: 'Caldo de verduras', amount: 500, unit: 'ml', category: 'Despensa y Cereales' },
    ],
  },
  {
    id: 'rec_tortilla_espinacas',
    name: 'Tortilla francesa con espinacas y ensalada',
    mealCategory: 'cena',
    dietGroup: 'verduras',
    prepTime: 12,
    servings: 2,
    description: 'Cena vegetariana ligera y rápida con espinacas frescas y ensalada de tomate para 2 personas.',
    steps: [
      'Saltear las espinacas frescas en la sartén 1 minuto.',
      'Batir los huevos con sal y pimienta, verter sobre las espinacas y cuajar dos tortillas.',
      'Acompañar con tomate de ensalada aliñado con aceite de oliva.',
    ],
    ingredients: [
      { id: 'i39', name: 'Huevo', amount: 4, unit: 'ud', category: 'Lácteos y Huevos' },
      { id: 'i40', name: 'Espinacas frescas', amount: 120, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'i41', name: 'Tomate de ensalada', amount: 2, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i42', name: 'Aceite de oliva virgen', amount: 2, unit: 'cda', category: 'Condimentos y Otros' },
    ],
  },
  {
    id: 'rec_wok_verduras_quinoa',
    name: 'Salteado de verduras con quinoa y huevo',
    mealCategory: 'cena',
    dietGroup: 'verduras',
    prepTime: 20,
    servings: 2,
    description: 'Bol templado de verduras variadas, quinoa cocida y huevo a la plancha.',
    steps: [
      'Cocer la quinoa previamente lavada en agua durante 14 minutos.',
      'Saltear brócoli, zanahoria en tiras y pimiento rojo con un chorrito de salsa de soja.',
      'Servir la quinoa con las verduras y coronar con un huevo a la plancha por persona.',
    ],
    ingredients: [
      { id: 'i75', name: 'Quinoa', amount: 130, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'i76', name: 'Brócoli', amount: 200, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'i77', name: 'Zanahoria', amount: 2, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i78', name: 'Pimiento rojo', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'i79', name: 'Huevo', amount: 2, unit: 'ud', category: 'Lácteos y Huevos' },
    ],
  },
];

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Genera automáticamente un menú semanal equilibrado para 2 personas combinando:
 * - 3 comidas de legumbres
 * - 4 comidas/cenas de pescado
 * - 3 comidas/cenas de carnes blancas
 * - 4 comidas/cenas de verduras y hortalizas
 * - 7 desayunos variados
 */
export function generateBalancedWeeklyMenu(recipes = INITIAL_RECIPES, targetServings = DEFAULT_SERVINGS) {
  const normalized = (recipes.length > 0 ? recipes : INITIAL_RECIPES).map((r) => ({
    ...r,
    dietGroup: r.dietGroup || inferDietGroup(r),
  }));

  const fallbackByGroup = Object.fromEntries(
    ['legumbres', 'verduras', 'pescado', 'carnes_blancas', 'desayuno_integral'].map((grp) => [
      grp,
      INITIAL_RECIPES.filter((r) => (r.dietGroup || inferDietGroup(r)) === grp),
    ]),
  );

  const pools = {};
  for (const grp of ['legumbres', 'verduras', 'pescado', 'carnes_blancas', 'desayuno_integral']) {
    const userGroup = normalized.filter((r) => r.dietGroup === grp);
    pools[grp] = shuffleArray(userGroup.length > 0 ? userGroup : fallbackByGroup[grp]);
  }

  const desayunoPool = normalized.filter((r) => r.mealCategory === 'desayuno');
  const activeDesayunos = shuffleArray(
    desayunoPool.length > 0 ? desayunoPool : fallbackByGroup.desayuno_integral,
  );

  const cursors = {
    legumbres: 0,
    verduras: 0,
    pescado: 0,
    carnes_blancas: 0,
    desayuno: 0,
  };

  const pickRecipe = (group, avoidIds = []) => {
    const list = group === 'desayuno' ? activeDesayunos : pools[group];
    if (!list || list.length === 0) return INITIAL_RECIPES[0];

    for (let offset = 0; offset < list.length; offset += 1) {
      const idx = (cursors[group] + offset) % list.length;
      if (!avoidIds.includes(list[idx].id)) {
        cursors[group] = (idx + 1) % list.length;
        return list[idx];
      }
    }
    const chosen = list[cursors[group] % list.length];
    cursors[group] = (cursors[group] + 1) % list.length;
    return chosen;
  };

  // Patrones semanales equilibrados (3 legumbres, 4 pescado, 3 carnes blancas, 4 verduras)
  const weeklyTemplates = [
    [
      { comida: 'legumbres', cena: 'pescado' },
      { comida: 'carnes_blancas', cena: 'verduras' },
      { comida: 'pescado', cena: 'verduras' },
      { comida: 'legumbres', cena: 'pescado' },
      { comida: 'carnes_blancas', cena: 'verduras' },
      { comida: 'legumbres', cena: 'carnes_blancas' },
      { comida: 'pescado', cena: 'verduras' },
    ],
    [
      { comida: 'carnes_blancas', cena: 'verduras' },
      { comida: 'legumbres', cena: 'pescado' },
      { comida: 'carnes_blancas', cena: 'verduras' },
      { comida: 'pescado', cena: 'verduras' },
      { comida: 'legumbres', cena: 'pescado' },
      { comida: 'pescado', cena: 'verduras' },
      { comida: 'legumbres', cena: 'carnes_blancas' },
    ],
  ];

  const template = weeklyTemplates[Math.floor(Math.random() * weeklyTemplates.length)];
  const menu = createEmptyMenu();
  let prevLunchId = null;
  let prevDinnerId = null;
  let prevBreakfastId = null;

  DAYS.forEach((day, index) => {
    const breakfast = pickRecipe('desayuno', prevBreakfastId ? [prevBreakfastId] : []);
    prevBreakfastId = breakfast.id;

    const slot = template[index];
    const lunch = pickRecipe(slot.comida, prevLunchId ? [prevLunchId] : []);
    prevLunchId = lunch.id;

    const dinner = pickRecipe(slot.cena, [prevDinnerId, lunch.id].filter(Boolean));
    prevDinnerId = dinner.id;

    menu[day.id].desayuno.push(createDishFromRecipe(breakfast, targetServings));
    menu[day.id].comida.push(createDishFromRecipe(lunch, targetServings));
    menu[day.id].cena.push(createDishFromRecipe(dinner, targetServings));
  });

  return menu;
}

export function calculateDietBalance(weeklyMenu) {
  const counts = {
    legumbres: 0,
    verduras: 0,
    pescado: 0,
    carnes_blancas: 0,
    desayuno_integral: 0,
  };

  for (const day of DAYS) {
    const dayMeals = weeklyMenu?.[day.id];
    if (!dayMeals) continue;
    for (const meal of MEAL_TYPES) {
      const dishes = dayMeals[meal.id] || [];
      for (const dish of dishes) {
        const grp = dish.dietGroup || inferDietGroup({ ...dish, mealCategory: meal.id });
        if (counts[grp] !== undefined) {
          counts[grp] += 1;
        }
      }
    }
  }

  return counts;
}

export function createSampleMenu(recipes = INITIAL_RECIPES) {
  return generateBalancedWeeklyMenu(recipes, DEFAULT_SERVINGS);
}
